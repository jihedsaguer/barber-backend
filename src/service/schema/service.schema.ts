import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ServiceDocument = Service & Document;

@Schema({ timestamps: true })
export class Service {
  @Prop({ required: true })
  name: string; // e.g. "Haircut", "Beard Trim"

  @Prop({ required: true })
  duration: number; // in minutes, e.g. 30, 45, 60

  @Prop({ required: true })
  price: number; // service price

  @Prop({ default: true })
  isActive: boolean; // enable/disable service
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
