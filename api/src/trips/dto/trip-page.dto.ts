import { ApiProperty } from '@nestjs/swagger';
import { TripDto } from './trip.dto.js';

export class TripPageDto {
  @ApiProperty({ type: [TripDto], description: 'Newest trip first' })
  items: TripDto[];

  @ApiProperty({ description: 'Total trips recorded for the vehicle' })
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
