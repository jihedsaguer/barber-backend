import { Injectable, OnModuleInit } from '@nestjs/common';
import { Connection } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';

@Injectable()
export class TestDatabaseService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    try {
      // Check the connection state
      if (this.connection && this.connection.readyState === 1) {
        console.log('✅ MongoDB is connected successfully!');
      } else {
        console.log('⚠️ MongoDB is not connected. Current state:', this.connection?.readyState);
      }
      
      if (this.connection?.db) {
        const collections = await this.connection.db.listCollections().toArray();
        console.log('Collections in the database:', collections.map(c => c.name));
      }
    } catch (error) {
      console.error('❌ Error connecting to MongoDB:', error);
    }
  }      
}
