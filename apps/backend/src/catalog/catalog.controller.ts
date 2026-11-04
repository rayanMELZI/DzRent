import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CatalogService } from './catalog.service';
import { AgencyCarsQueryDto, QuoteDto, SearchAgenciesDto } from './dto/catalog.dto';

/**
 * Public, unauthenticated catalogue for the client website. Everything here is
 * read-only and client-safe; booking itself still goes through the authenticated
 * `/bookings` flow (KYC, blacklist and risk gates).
 */
@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('wilayas')
  @ApiOperation({ summary: 'Active wilayas (reference data)' })
  async wilayas() {
    return { success: true, data: await this.catalog.wilayas() };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Active vehicle categories (reference data)' })
  async categories() {
    return { success: true, data: await this.catalog.categories() };
  }

  @Get('agencies')
  @ApiOperation({ summary: 'Agency-first search: agencies with bookable cars in a wilaya/period' })
  async search(@Query() q: SearchAgenciesDto) {
    return { success: true, ...(await this.catalog.searchAgencies(q)) };
  }

  @Get('agencies/:id')
  @ApiOperation({ summary: 'Public agency page: trust info, bookable cars, recent reviews' })
  async agency(@Param('id', ParseUUIDPipe) id: string, @Query() q: AgencyCarsQueryDto) {
    return { success: true, data: await this.catalog.agency(id, q) };
  }

  @Get('vehicles/:id')
  @ApiOperation({ summary: 'Public car detail with pricing and agency snippet' })
  async vehicle(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.catalog.vehicle(id) };
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Price quote for a car/period/options (same engine as bookings)' })
  async quote(@Body() dto: QuoteDto) {
    return { success: true, data: await this.catalog.quote(dto) };
  }
}
