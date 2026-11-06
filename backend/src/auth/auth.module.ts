import { Global, Module } from '@nestjs/common';
import { AddressesController } from 'src/auth/controllers/addresses.controller';
import { AuthController } from 'src/auth/controllers/auth.controller';
import { AccessService } from 'src/auth/services/access.service';
import { AddressesService } from 'src/auth/services/addresses.service';
import { AuthService } from 'src/auth/services/auth.service';

/** Global so any controller's `@UseGuards(AuthGuard, RolesGuard)` can resolve the AccessService. */
@Global()
@Module({
  controllers: [AuthController, AddressesController],
  providers: [AuthService, AccessService, AddressesService],
  exports: [AccessService],
})
export class AuthModule {}
