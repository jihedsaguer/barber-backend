import { Module, OnModuleInit } from '@nestjs/common';
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
    DatabaseModule,
    BarberModule,
    ClientModule,
    ServiceModule,
    AvailabilityModule,
    ReservationModule,
    AuthModule,
    ServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService, TestDatabaseService], // Add the test service here

})
export class AppModule implements OnModuleInit {
  constructor(private readonly testDatabaseService: TestDatabaseService) {}

  async onModuleInit() {
    // Trigger the database test
    console.log('🔹 AppModule initialized, running database test...');
    await this.testDatabaseService.onModuleInit();
  }
}
