import {
    Controller,
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { OrdersService } from './orders.service';

@Public()
@Controller('api/orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    createOrder(@Body() dto: any) {
        return this.ordersService.createOrder(dto);
    }

    @Get('stats')
    getStats(@Query('city_id') cityId?: string) {
        return this.ordersService.getDashboardStats(cityId ? Number(cityId) : undefined);
    }

    @Get(':id')
    getOrderById(@Param('id') id: string) {
        return this.ordersService.getOrderById(id);
    }

    @Get()
    getOrders(@Query('user_id') userId?: string, @Query('city_id') cityId?: string) {
        if (userId) return this.ordersService.getUserOrders(userId);
        return this.ordersService.getAllOrders(cityId ? Number(cityId) : undefined);
    }


    @Get('addresses')
    getUserAddresses(@Query('user_id') userId: string) {
        return this.ordersService.getUserAddresses(userId);
    }

    @Post('addresses')
    saveAddress(@Body() data: any) {
        return this.ordersService.saveAddress(data);
    }

    @Put(':id/status')
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.ordersService.updateOrderStatus(id, status);
    }
}
