import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PushSubscriptionDocument = PushSubscription & Document;

@Schema({ timestamps: true })
export class PushSubscription {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  endpoint: string;

  @Prop({ required: true })
  p256dh: string; // Public key

  @Prop({ required: true })
  auth: string; // Auth secret

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  userAgent?: string; // To identify device/browser

  @Prop()
  deviceName?: string; // Optional device identifier
}

export const PushSubscriptionSchema = SchemaFactory.createForClass(PushSubscription);