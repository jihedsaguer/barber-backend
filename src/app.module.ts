import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BarberModule } from './barber/barber.module';
import { ClientModule } from './client/client.module';
import { ServiceModule } from './service/service.module';
import { AvailabilityModule } from './availability/availability.module';
import { ReservationModule } from './reservation/reservation.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { TestDatabaseService } from './database/test-database.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production' ? undefined : '.env',
      cache: true,
    }),
    DatabaseModule,
    BarberModule,
    ClientModule,
    ServiceModule,
    AvailabilityModule,
    ReservationModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestDatabaseService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly testDatabaseService: TestDatabaseService) {}

  async onModuleInit() {
    // Only run database test in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔹 AppModule initialized, running database test...');
      await this.testDatabaseService.onModuleInit();
    }
  }
}
