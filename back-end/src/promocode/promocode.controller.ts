import {
    Controller,
    Get,
    Post,
    Delete,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { PromocodeService } from './promocode.service';

@Controller('api/promocodes')
export class PromocodeController {
    constructor(private readonly promoService: PromocodeService) { }

    @Get()
    getAll(@Query('city_id') cityId?: number) {
        return this.promoService.getAll(cityId);
    }

    @Get('visible')
    getVisible(@Query('city_id') cityId?: number, @Query('user_id') userId?: string) {
        return this.promoService.getVisible(cityId, userId);
    }

    @Get('user/:userId')
    getUserPromocodes(@Param('userId') userId: string) {
        return this.promoService.getUserPromocodes(userId);
    }

    @Post()
    create(@Body() data: any) {
        return this.promoService.create(data);
    }

    @Post('validate')
    validate(@Body('code') code: string, @Body('city_id') cityId?: number) {
        return this.promoService.validate(code, cityId);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.promoService.delete(id);
    }
}
