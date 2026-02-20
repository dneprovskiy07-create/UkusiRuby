import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { SettingsService } from './settings.service';

@Controller('api/settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Public()
    @Get()
    getSettings() {
        return this.settingsService.getSettings();
    }

    @Put(':key')
    updateSetting(@Param('key') key: string, @Body('value') value: string) {
        return this.settingsService.updateSetting(key, value);
    }

    @Public()
    @Get('cities')
    getCities() {
        return this.settingsService.getCities();
    }

    @Post('cities')
    createCity(@Body() data: any) {
        return this.settingsService.createCity(data);
    }

    @Put('cities/:id')
    updateCity(@Param('id') id: number, @Body() data: any) {
        return this.settingsService.updateCity(id, data);
    }

    @Delete('cities/:id')
    deleteCity(@Param('id') id: number) {
        return this.settingsService.deleteCity(id);
    }
}
