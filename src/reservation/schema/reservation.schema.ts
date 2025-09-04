import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReservationDocument = Reservation & Document;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  clientId: Types.ObjectId;

  @Prop({ required: true })
  clientName: string;

  @Prop()
  clientPhone?: string;

  // ✅ FIXED: Support both single and multiple services
  @Prop({ type: [Types.ObjectId], required: true, ref: 'Service' })
  serviceIds: Types.ObjectId[];

  // Add service details for easy access (denormalized data)
  @Prop([{
    serviceId: { type: Types.ObjectId, ref: 'Service' },
    serviceName: String,
    duration: Number,
    price: Number
  }])
  services: {
    serviceId: Types.ObjectId;
    serviceName: string;
    duration: number;
    price: number;
  }[];

  @Prop({ required: true })
  barberName: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  startTime: string;

  @Prop({ required: true })
  endTime: string;

  @Prop({ 
    required: true, 
    enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
    default: 'pending' 
  })
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';

  @Prop()
  notes?: string;

  // Calculated fields
  @Prop()
  totalDuration?: number;

  @Prop()
  totalPrice?: number;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);