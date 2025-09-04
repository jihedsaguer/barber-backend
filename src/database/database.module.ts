import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import * as dotenv from 'dotenv';
import { TestDatabaseService } from './test-database.service';

dotenv.config(); // Load .env

const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI is not defined in .env file');
}

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri),
  ],
  providers: [TestDatabaseService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
