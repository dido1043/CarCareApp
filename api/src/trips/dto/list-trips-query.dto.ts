import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_TRIP_PAGE_SIZE = 50;
export const MAX_TRIP_PAGE_SIZE = 200;

/** Offset paging: trip history is append-only and read newest-first. */
export class ListTripsQueryDto {
  @ApiPropertyOptional({ default: DEFAULT_TRIP_PAGE_SIZE, maximum: MAX_TRIP_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_TRIP_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}
