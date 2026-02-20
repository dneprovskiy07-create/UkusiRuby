import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CatalogService } from './catalog.service';

@Public()
@Controller('api')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    // ── Категории (GET — public, POST/PUT/DELETE — admin) ──
    @Public()
    @Get('categories')
    getCategories(
        @Query('all') all?: string,
        @Query('city_id') cityId?: number
    ) {
        if (all === 'true') return this.catalogService.getAllCategories(cityId);
        return this.catalogService.getCategories(cityId);
    }

    @Public()
    @Get('categories/:id')
    getCategoryById(@Param('id') id: number) {
        return this.catalogService.getCategoryById(id);
    }

    @Post('categories')
    createCategory(@Body() data: any) {
        return this.catalogService.createCategory(data);
    }

    @Put('categories/:id')
    updateCategory(@Param('id') id: number, @Body() data: any) {
        return this.catalogService.updateCategory(id, data);
    }

    @Delete('categories/:id')
    deleteCategory(@Param('id') id: number) {
        return this.catalogService.deleteCategory(id);
    }

    @Post('categories/:id/reorder')
    async reorderCategory(@Param('id') id: number, @Body() dto: { direction: 'up' | 'down' }) {
        await this.catalogService.reorderCategory(id, dto.direction);
        return { success: true };
    }

    // ── Товары (GET — public, POST/PUT/DELETE — admin) ──
    @Public()
    @Get('products')
    getProducts(
        @Query('category_id') categoryId?: number,
        @Query('sort') sort?: string,
        @Query('all') all?: string,
        @Query('city_id') cityId?: number,
    ) {
        if (all === 'true') return this.catalogService.getAllProducts(cityId);
        return this.catalogService.getProducts(categoryId, sort, cityId);
    }

    @Public()
    @Get('products/search')
    searchProducts(
        @Query('q') q: string,
        @Query('city_id') cityId?: number
    ) {
        return this.catalogService.searchProducts(q, cityId);
    }

    @Public()
    @Get('products/:id')
    getProductById(@Param('id') id: string) {
        return this.catalogService.getProductById(id);
    }

    @Post('products')
    createProduct(@Body() data: any) {
        return this.catalogService.createProduct(data);
    }

    @Put('products/:id')
    updateProduct(@Param('id') id: string, @Body() data: any) {
        return this.catalogService.updateProduct(id, data);
    }

    @Delete('products/:id')
    deleteProduct(@Param('id') id: string) {
        return this.catalogService.deleteProduct(id);
    }

    @Post('products/:id/reorder')
    async reorderProduct(@Param('id') id: string, @Body() dto: { direction: 'up' | 'down' }) {
        await this.catalogService.reorderProduct(id, dto.direction);
        return { success: true };
    }

    // ── Точки самовывоза (GET — public) ──
    @Public()
    @Get('pickup-points')
    getPickupPoints(@Query('city_id') cityId: number) {
        return this.catalogService.getPickupPoints(cityId);
    }

    @Post('pickup-points')
    createPickupPoint(@Body() data: any) {
        return this.catalogService.createPickupPoint(data);
    }

    @Put('pickup-points/:id')
    updatePickupPoint(@Param('id') id: string, @Body() data: any) {
        return this.catalogService.updatePickupPoint(id, data);
    }

    @Delete('pickup-points/:id')
    deletePickupPoint(@Param('id') id: string) {
        return this.catalogService.deletePickupPoint(id);
    }

    @Post('catalog/sync')
    syncCityMenu(@Body() dto: { fromCityId: number; toCityId: number }) {
        return this.catalogService.syncCityMenu(dto.fromCityId, dto.toCityId);
    }

    @Post('catalog/sync-all')
    syncAllCities() {
        return this.catalogService.syncAllCities();
    }

    @Post('catalog/migrate')
    async migrate() {
        try {
            return await this.catalogService.migrateExistingData();
        } catch (e) {
            return { success: false, error: e.message };
        }
    }
}
