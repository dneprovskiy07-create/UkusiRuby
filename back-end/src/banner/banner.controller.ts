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
import { BannerService } from './banner.service';

@Controller('api/banners')
export class BannerController {
    constructor(private readonly bannerService: BannerService) { }

    @Get()
    getActive(@Query('city_id') cityId?: number) {
        return this.bannerService.getActive(cityId);
    }

    @Get('all')
    getAll(@Query('city_id') cityId?: number) {
        return this.bannerService.getAll(cityId);
    }

    @Post()
    create(@Body() data: any) {
        return this.bannerService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: number, @Body() data: any) {
        return this.bannerService.update(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: number) {
        return this.bannerService.delete(id);
    }
}
