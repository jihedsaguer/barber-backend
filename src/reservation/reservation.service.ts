import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schema/reservation.schema';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { Service, ServiceDocument } from '../service/schema/service.schema';
import { PushNotificationService } from '../notifications/push-notification.service';

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);
  private readonly BARBERS = ['Adib'];

  constructor(
    @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
    @InjectModel(Service.name) private readonly serviceModel: Model<ServiceDocument>,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  // Create a reservation and assign authenticated user as client
  async createReservation(dto: CreateReservationDto, userId: string): Promise<Reservation> {
    this.logger.debug('🔍 Creating reservation for userId:', userId);
    this.logger.debug('📝 Reservation data:', JSON.stringify(dto));

    // 1️⃣ Validate barber
    if (!this.BARBERS.includes(dto.barberName)) {
      throw new BadRequestException(`Barber "${dto.barberName}" does not exist.`);
    }

    // 2️⃣ Validate date (cannot be in the past)
    const now = new Date();
    const reservationDate = new Date(dto.date);
    if (reservationDate < new Date(now.setHours(0, 0, 0, 0))) {
      throw new BadRequestException('You cannot book a reservation in the past.');
    }

    // 3️⃣ Handle serviceIds (must have at least one)
    let serviceIds: string[] = [];
    if (dto.serviceId) {
      serviceIds = [dto.serviceId];
    } else if (dto.serviceIds && dto.serviceIds.length > 0) {
      serviceIds = dto.serviceIds;
    } else {
      throw new BadRequestException('At least one service must be specified (serviceId or serviceIds).');
    }

    this.logger.debug('🔍 Processing services:', serviceIds);

    // 4️⃣ Fetch services
    const services = await this.serviceModel.find({ _id: { $in: serviceIds } });
    if (services.length !== serviceIds.length) {
      throw new BadRequestException('One or more selected services do not exist.');
    }

    // 5️⃣ Calculate total duration & end time
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
    const totalPrice = services.reduce((sum, service) => sum + service.price, 0);

    const [hours, minutes] = dto.startTime.split(':').map(Number);
    const startDate = new Date(reservationDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + totalDuration * 60000);
    const endTime = endDate.toTimeString().slice(0, 5); // "HH:MM"

    // 6️⃣ Ensure logical time range
    if (endDate <= startDate) {
      throw new BadRequestException('End time must be after start time.');
    }

    // 7️⃣ Prevent overlapping reservations for the same barber
    const overlap = await this.reservationModel.findOne({
      barberName: dto.barberName,
      date: reservationDate,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: dto.startTime },
        },
      ],
      status: { $in: ['pending', 'confirmed'] }, // block only active reservations
    });

    if (overlap) {
      throw new BadRequestException('This time slot is already booked for the selected barber.');
    }

    // 8️⃣ Prepare reservation data
    const serviceDetails = services.map(service => ({
      serviceId: service._id,
      serviceName: service.name,
      duration: service.duration,
      price: service.price,
    }));

    const reservationData = {
      clientId: new Types.ObjectId(userId),
      clientName: dto.clientName,
      clientPhone: dto.clientPhone,
      serviceIds: serviceIds.map(id => new Types.ObjectId(id)),
      services: serviceDetails,
      barberName: dto.barberName,
      date: reservationDate,
      startTime: dto.startTime,
      endTime,
      status: 'pending' as const,
      notes: dto.notes,
      totalDuration,
      totalPrice,
    };

    this.logger.debug('💾 Saving reservation:', JSON.stringify(reservationData));

    const reservation = new this.reservationModel(reservationData);
    const savedReservation = await reservation.save();

    // 🔔 Send push notification to admins about new reservation
    try {
      await this.pushNotificationService.sendNewReservationNotification(savedReservation);
      this.logger.log('📱 Push notification sent for new reservation');
    } catch (error) {
      this.logger.error('❌ Failed to send push notification:', error.message);
      // Don't fail the reservation creation if notification fails
    }

    return savedReservation;
  }

  // Get reservations (filter by clientId for regular users, or return all for booking availability)
  async getReservations(clientId?: string, filters?: Partial<Reservation>): Promise<Reservation[]> {
    const query: any = { ...filters };
    
    if (clientId) {
      query.clientId = new Types.ObjectId(clientId);
      this.logger.debug('🔍 Querying reservations for clientId:', clientId);
    } else {
      this.logger.debug('🔍 Querying all reservations (admin view or booking availability)');
    }
    
    const reservations = await this.reservationModel.find(query).exec();
    this.logger.debug(`📋 Found ${reservations.length} reservations`);
    
    return reservations;
  }

  // Update reservation
  async updateReservation(id: string, dto: UpdateReservationDto): Promise<Reservation> {
    this.logger.debug('🔄 Updating reservation:', id);
    
    // Get the current reservation to compare status
    const currentReservation = await this.reservationModel.findById(id);
    if (!currentReservation) {
      throw new NotFoundException('Reservation not found.');
    }

    const oldStatus = currentReservation.status;
    
    const reservation = await this.reservationModel.findByIdAndUpdate(
      id,
      { ...dto, updatedAt: new Date() },
      { new: true },
    );
    
    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    // 🔔 Send push notification if status changed
    if (dto.status && dto.status !== oldStatus) {
      try {
        await this.pushNotificationService.sendReservationStatusNotification(reservation, oldStatus);
        this.logger.log(`📱 Push notification sent for status change: ${oldStatus} → ${dto.status}`);
      } catch (error) {
        this.logger.error('❌ Failed to send status change notification:', error.message);
        // Don't fail the update if notification fails
      }
    }
    
    this.logger.debug('✅ Reservation updated successfully');
    return reservation;
  }

  // Delete reservation
  async deleteReservation(id: string): Promise<{ message: string }> {
    this.logger.debug('🗑️ Deleting reservation:', id);
    
    const result = await this.reservationModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Reservation not found.');
    }
    
    this.logger.debug('✅ Reservation deleted successfully');
    return { message: 'Reservation deleted successfully' };
  }
}
