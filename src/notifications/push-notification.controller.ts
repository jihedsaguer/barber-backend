import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  Headers,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PushNotificationService } from './push-notification.service';
import { CreatePushSubscriptionDto, SendNotificationDto } from './dto/push-notification.dto';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class PushNotificationController {
  private readonly logger = new Logger(PushNotificationController.name);

  constructor(private readonly pushNotificationService: PushNotificationService) {}

  /**
   * Get VAPID public key for frontend
   */
  @Get('vapid-public-key')
  getVapidPublicKey() {
    return {
      publicKey: this.pushNotificationService.getVapidPublicKey(),
    };
  }

  /**
   * Subscribe to push notifications (Admin only)
   */
  @Post('subscribe')
  async subscribe(
    @Body() subscriptionDto: CreatePushSubscriptionDto,
    @Request() req,
    @Headers('user-agent') userAgent?: string,
  ) {
    // Only allow admin users to subscribe
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin users can subscribe to push notifications');
    }

    this.logger.log(`📱 Admin user ${req.user.sub} subscribing to push notifications`);

    const subscription = await this.pushNotificationService.subscribe(
      req.user.sub,
      subscriptionDto,
      userAgent,
    );

    return {
      message: 'Successfully subscribed to push notifications',
      subscription: {
        id: (subscription as any)._id,
        deviceName: subscription.deviceName,
        createdAt: (subscription as any).createdAt,
      },
    };
  }

  /**
   * Unsubscribe from push notifications
   */
  @Delete('unsubscribe')
  async unsubscribe(@Body('endpoint') endpoint: string, @Request() req) {
    this.logger.log(`📱 User ${req.user.sub} unsubscribing from push notifications`);

    return this.pushNotificationService.unsubscribe(req.user.sub, endpoint);
  }

  /**
   * Get user's active subscriptions
   */
  @Get('subscriptions')
  async getSubscriptions(@Request() req) {
    const subscriptions = await this.pushNotificationService.getUserSubscriptions(req.user.sub);
    
    return {
      subscriptions: subscriptions.map(sub => ({
        id: (sub as any)._id,
        deviceName: sub.deviceName,
        userAgent: sub.userAgent,
        createdAt: (sub as any).createdAt,
      })),
    };
  }

  /**
   * Test notification (Admin only - for testing purposes)
   */
  @Post('test')
  async sendTestNotification(@Request() req, @Body() notification?: SendNotificationDto) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin users can send test notifications');
    }

    const testNotification: SendNotificationDto = notification || {
      title: '🧪 Test Notification',
      body: 'This is a test notification from your barber booking system',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
      data: { type: 'test', timestamp: Date.now() },
    };

    const result = await this.pushNotificationService.sendToAdmins(testNotification);

    return {
      message: 'Test notification sent',
      result,
    };
  }
}