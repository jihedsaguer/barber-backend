import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TestDatabaseService } from './test-database.service';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI') || configService.get<string>('MONGO_URI');
        
        if (!uri) {
          throw new Error('MONGODB_URI or MONGO_URI must be defined in environment variables');
        }

        return {
          uri,
          retryWrites: true,
          w: 'majority',
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [TestDatabaseService],
  exports: [MongooseModule],
})
export class DatabaseModule {}
