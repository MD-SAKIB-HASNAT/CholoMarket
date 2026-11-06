import { InitialSchema1792695205907 } from 'src/database/postgres/migrations/1792695205907-InitialSchema';
import { SearchIndexesAndViews1792695205908 } from 'src/database/postgres/migrations/1792695205908-SearchIndexesAndViews';
import { CategoryImagesAndBanners1792764924452 } from 'src/database/postgres/migrations/1792764924452-CategoryImagesAndBanners';
import { HomeDeliveryAndCouriers1792769940290 } from 'src/database/postgres/migrations/1792769940290-HomeDeliveryAndCouriers';
import { BannerPhoneImage1792928901719 } from 'src/database/postgres/migrations/1792928901719-BannerPhoneImage';
import { LocationsSubAreas1792999176732 } from 'src/database/postgres/migrations/1792999176732-LocationsSubAreas';
import { NearbyInKm1793500000000 } from 'src/database/postgres/migrations/1793500000000-NearbyInKm';

/** Registered explicitly (no glob) so the list works the same under tsx, ts-node and compiled dist. */
export const MIGRATIONS = [
  InitialSchema1792695205907,
  SearchIndexesAndViews1792695205908,
  CategoryImagesAndBanners1792764924452,
  HomeDeliveryAndCouriers1792769940290,
  BannerPhoneImage1792928901719,
  LocationsSubAreas1792999176732,
  NearbyInKm1793500000000,
];
