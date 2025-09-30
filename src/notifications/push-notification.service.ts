import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import { PushSubscription, PushSubscriptionDocument } from './schema/push-subscription.schema';
import { CreatePushSubscriptionDto, SendNotificationDto } from './dto/push-notification.dto';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @InjectModel(PushSubscription.name)
    private readonly pushSubscriptionModel: Model<PushSubscriptionDocument>,
    private readonly configService: ConfigService,
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT');

    if (!publicKey || !privateKey || !subject) {
      this.logger.warn('⚠️ VAPID keys not configured. Push notifications will not work.');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.logger.log('✅ Web Push initialized with VAPID keys');
  }

  /**
   * Subscribe an admin user to push notifications
   */
  async subscribe(userId: string, subscriptionDto: CreatePushSubscriptionDto, userAgent?: string): Promise<PushSubscription> {
    this.logger.log(`📱 Subscribing user ${userId} to push notifications`);

    // Check if subscription already exists
    const existingSubscription = await this.pushSubscriptionModel.findOne({
      userId: new Types.ObjectId(userId),
      endpoint: subscriptionDto.endpoint,
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.p256dh = subscriptionDto.keys.p256dh;
      existingSubscription.auth = subscriptionDto.keys.auth;
      existingSubscription.isActive = true;
      existingSubscription.userAgent = userAgent;
      existingSubscription.deviceName = subscriptionDto.deviceName;
      
      return existingSubscription.save();
    }

    // Create new subscription
    const subscription = new this.pushSubscriptionModel({
      userId: new Types.ObjectId(userId),
      endpoint: subscriptionDto.endpoint,
      p256dh: subscriptionDto.keys.p256dh,
      auth: subscriptionDto.keys.auth,
      userAgent,
      deviceName: subscriptionDto.deviceName,
      isActive: true,
    });

    return subscription.save();
  }

  /**
   * Unsubscribe a user from push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<{ message: string }> {
    this.logger.log(`📱 Unsubscribing user ${userId} from endpoint: ${endpoint}`);

    await this.pushSubscriptionModel.updateOne(
      { userId: new Types.ObjectId(userId), endpoint },
      { isActive: false }
    );

    return { message: 'Successfully unsubscribed from push notifications' };
  }

  /**
   * Get all active subscriptions for admin users
   */
  async getAdminSubscriptions(): Promise<PushSubscriptionDocument[]> {
    // This assumes you have a way to identify admin users
    // You might need to join with User collection to filter by role
    return this.pushSubscriptionModel.find({ isActive: true }).populate('userId').exec();
  }

  /**
   * Send notification to all admin users
   */
  async sendToAdmins(notification: SendNotificationDto): Promise<{ sent: number; failed: number }> {
    this.logger.log(`📢 Sending notification to all admins: ${notification.title}`);

    const subscriptions = await this.getAdminSubscriptions();
    
    if (subscriptions.length === 0) {
      this.logger.warn('⚠️ No admin subscriptions found');
      return { sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192x192.png',
      badge: notification.badge || '/badge-72x72.png',
      tag: notification.tag || 'reservation-notification',
      data: notification.data || {},
      timestamp: Date.now(),
    });

    let sent = 0;
    let failed = 0;

    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, payload);
        sent++;
        this.logger.debug(`✅ Notification sent to user ${subscription.userId}`);
      } catch (error) {
        failed++;
        this.logger.error(`❌ Failed to send notification to user ${subscription.userId}:`, error.message);
        
        // If subscription is invalid, mark as inactive
        if (error.statusCode === 410 || error.statusCode === 404) {
          await this.pushSubscriptionModel.updateOne(
            { _id: subscription._id },
            { isActive: false }
          );
          this.logger.log(`🗑️ Marked invalid subscription as inactive: ${subscription._id}`);
        }
      }
    });

    await Promise.all(promises);

    this.logger.log(`📊 Notification results: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Send notification for new reservation
   */
  async sendNewReservationNotification(reservation: any): Promise<{ sent: number; failed: number }> {
    const serviceNames = reservation.services?.map(s => s.serviceName).join(', ') || 'Services';
    
    const notification: SendNotificationDto = {
      title: '🆕 New Reservation',
      body: `${reservation.clientName} booked ${serviceNames} with ${reservation.barberName} on ${new Date(reservation.date).toLocaleDateString()}`,
      icon: '/icon-192x192.png',
      tag: 'new-reservation',
      data: {
        type: 'new_reservation',
        reservationId: reservation._id,
        clientName: reservation.clientName,
        barberName: reservation.barberName,
        date: reservation.date,
        startTime: reservation.startTime,
        services: serviceNames,
      },
    };

    return this.sendToAdmins(notification);
  }

  /**
   * Send notification for reservation status change
   */
  async sendReservationStatusNotification(reservation: any, oldStatus: string): Promise<{ sent: number; failed: number }> {
    const statusEmojis = {
      confirmed: '✅',
      cancelled: '❌',
      completed: '🎉',
    };

    const emoji = statusEmojis[reservation.status] || '📝';
    
    const notification: SendNotificationDto = {
      title: `${emoji} Reservation ${reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}`,
      body: `${reservation.clientName}'s reservation with ${reservation.barberName} has been ${reservation.status}`,
      icon: '/icon-192x192.png',
      tag: 'reservation-status',
      data: {
        type: 'status_change',
        reservationId: reservation._id,
        clientName: reservation.clientName,
        barberName: reservation.barberName,
        oldStatus,
        newStatus: reservation.status,
        date: reservation.date,
        startTime: reservation.startTime,
      },
    };

    return this.sendToAdmins(notification);
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
  }

  /**
   * Get user's subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<PushSubscriptionDocument[]> {
    return this.pushSubscriptionModel.find({
      userId: new Types.ObjectId(userId),
      isActive: true,
    }).exec();
  }
}