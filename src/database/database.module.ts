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
          console.error('❌ Database Configuration Error:');
          console.error('   MONGODB_URI or MONGO_URI environment variable is missing');
          console.error('   Please set one of these variables in your Railway dashboard');
          console.error('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db');
          throw new Error('MONGODB_URI or MONGO_URI must be defined in environment variables');
        }

        console.log('✅ Database URI found, attempting connection...');
        
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
