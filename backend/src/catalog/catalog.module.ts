import { Module } from '@nestjs/common';
import { BannersController } from 'src/catalog/controllers/banners.controller';
import {
  BrandsAdminController,
  BrandsController,
} from 'src/catalog/controllers/brands.controller';
import { CategoriesController } from 'src/catalog/controllers/categories.controller';
import { MarketsController } from 'src/catalog/controllers/markets.controller';
import { ProductsController } from 'src/catalog/controllers/products.controller';
import { SearchController } from 'src/catalog/controllers/search.controller';
import { ShopsController } from 'src/catalog/controllers/shops.controller';
import { StatsController } from 'src/catalog/controllers/stats.controller';
import { WishlistController } from 'src/catalog/controllers/wishlist.controller';
import { BannersService } from 'src/catalog/services/banners.service';
import { BrandsService } from 'src/catalog/services/brands.service';
import { CategoriesService } from 'src/catalog/services/categories.service';
import { MarketsService } from 'src/catalog/services/markets.service';
import { ProductCardsService } from 'src/catalog/services/product-cards.service';
import { ProductsService } from 'src/catalog/services/products.service';
import { SearchService } from 'src/catalog/services/search.service';
import { ShopFollowsService } from 'src/catalog/services/shop-follows.service';
import { StatsService } from 'src/catalog/services/stats.service';
import { ShopsService } from 'src/catalog/services/shops.service';
import { WishlistService } from 'src/catalog/services/wishlist.service';
import { GeoModule } from 'src/geo/geo.module';

/** What shoppers browse: markets, shops, products, brands, categories, banners, search and the wishlist. */
@Module({
  imports: [GeoModule],
  controllers: [
    BannersController,
    BrandsController,
    BrandsAdminController,
    CategoriesController,
    MarketsController,
    ProductsController,
    SearchController,
    ShopsController,
    StatsController,
    WishlistController,
  ],
  providers: [
    BannersService,
    BrandsService,
    CategoriesService,
    MarketsService,
    ProductCardsService,
    ProductsService,
    SearchService,
    ShopFollowsService,
    ShopsService,
    StatsService,
    WishlistService,
  ],
  exports: [MarketsService, ProductsService, ShopsService],
})
export class CatalogModule {}
