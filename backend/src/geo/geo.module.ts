import { Module } from '@nestjs/common';
import {
  GeoAdminController,
  GeoController,
} from 'src/geo/controllers/geo.controller';
import { NearbyMapController } from 'src/geo/controllers/nearby-map.controller';
import { NearbyMapService } from 'src/geo/services/nearby-map.service';
import { GeoService } from 'src/geo/services/geo.service';
import { NearbyService } from 'src/geo/services/nearby.service';

@Module({
  controllers: [GeoController, GeoAdminController, NearbyMapController],
  providers: [GeoService, NearbyService, NearbyMapService],
  exports: [GeoService, NearbyService],
})
export class GeoModule {}
