import { PartialType } from '@nestjs/swagger';
import { DestinationType, LocationShareType } from './promise.entity';

export class InputCreatePromise {
  title!: string;
  themeIds!: number[];
  promisedAt!: number;
  destinationType!: DestinationType;
  destination?: {
    city: string;
    district: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  locationShareStartType!: LocationShareType;
  locationShareStartValue!: number;
  locationShareEndType!: LocationShareType;
  locationShareEndValue!: number;
}

export class OutputCreatePromise {
  id!: number;
  inviteLink!: string;
}

export class InputUpdatePromise extends PartialType(InputCreatePromise) {
  id!: number;
}

export class OutputUpdatePromise {
  id!: number;
}
