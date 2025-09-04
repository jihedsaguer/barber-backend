import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, Logger } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto, UpdateReservationDto } from './dto/reservation.dto';
import { Reservation } from './schema/reservation.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('reservations')
export class ReservationController {
  private readonly logger = new Logger(ReservationController.name);

  constructor(private readonly reservationService: ReservationService) { }

  private logUser(req: any) {
    this.logger.debug('Incoming request headers: ' + JSON.stringify(req.headers));
    this.logger.debug('User object from JWT: ' + JSON.stringify(req.user));
  }

  // 🔍 DEBUG ENDPOINT - Add this temporarily to test JWT
  @Get('debug/auth')
  @UseGuards(AuthGuard('jwt'))
  async debugAuth(@Request() req): Promise<any> {
    this.logger.debug('🔍 DEBUG: Auth test endpoint hit');
    this.logger.debug('🔍 DEBUG: Headers:', JSON.stringify(req.headers));
    this.logger.debug('🔍 DEBUG: User:', JSON.stringify(req.user));

    return {
      success: true,
      user: req.user,
      message: 'JWT Authentication is working!',
      timestamp: new Date().toISOString()
    };
  }

  // Create a reservation (authenticated users only)
  @Post('create')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() dto: CreateReservationDto, @Request() req): Promise<Reservation> {
    this.logUser(req);
    console.log('✅ ReservationController.createReservation hit');
    console.log('👤 Authenticated user:', req.user);

    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }
    const clientId = req.user?.sub || req.user?.id;
    this.logger.debug('Resolved clientId: ' + clientId);
    return this.reservationService.createReservation(dto, clientId);
  }

  // Get all reservations (admins see all, users see their own)
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Request() req, @Query() query: any): Promise<Reservation[]> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }
    
    // Check for booking availability flags
    const forBooking = query.forBooking === 'true' || query.includeAll === 'true' || query.allUsers === 'true';

    // If requesting for booking calendar, return all reservations regardless of user
    // Otherwise maintain existing behavior (admins see all, users see own)
    const clientId = forBooking ? undefined : (req.user.role === 'admin' ? undefined : req.user?.sub || req.user?.id);

    this.logger.debug('Booking availability request: ' + forBooking);
    this.logger.debug('Resolved clientId for query: ' + clientId);

    // Remove booking flags from query before passing to service
    const { forBooking: _, includeAll: __, allUsers: ___, ...filters } = query;

    return this.reservationService.getReservations(clientId, filters);
  }

  // Update a reservation by id (authenticated)
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateReservationDto,
    @Request() req,
  ): Promise<Reservation> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }

    return this.reservationService.updateReservation(id, dto);
  }

  // Delete a reservation by id (authenticated)
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req): Promise<{ message: string }> {
    this.logUser(req);
    if (!req.user) {
      this.logger.warn('No user found in request. JWT may be missing or invalid.');
      throw new Error('Unauthorized: No user found');
    }

    return this.reservationService.deleteReservation(id);
  }
}