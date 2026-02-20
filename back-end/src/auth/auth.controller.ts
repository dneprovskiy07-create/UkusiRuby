import { Controller, Post, Get, Put, Delete, Body, Param, Request } from '@nestjs/common';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Post('register')
    register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Public()
    @Post('login')
    login(@Body() body: any) {
        return this.authService.login(body);
    }

    @Public()
    @Post('forgot-password')
    forgotPassword(@Body() body: any) {
        console.log('Forgot Password Request Body:', body);
        return this.authService.forgotPassword(body.email);
    }

    @Public()
    @Post('reset-password')
    resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    @Public()
    @Post('send-otp')
    sendOtp(@Body('phone') phone: string) {
        return this.authService.sendOtp(phone);
    }

    @Public()
    @Post('verify-otp')
    verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
        return this.authService.verifyOtp(phone, code);
    }

    // Protected routes — require JWT
    @Get('profile/:id')
    getProfile(@Param('id') id: string) {
        return this.authService.getProfile(id);
    }

    @Put('profile/:id')
    updateProfile(@Param('id') id: string, @Body() data: any) {
        return this.authService.updateProfile(id, data);
    }

    // --- Address Endpoints ---

    @Post('profile/:id/addresses')
    addAddress(@Param('id') id: string, @Body() body: any) {
        return this.authService.addAddress(id, body);
    }

    @Get('profile/:id/addresses')
    getAddresses(@Param('id') id: string) {
        return this.authService.getAddresses(id);
    }

    // Use DELETE verb for deleting resources
    @Post('profile/:id/addresses/:addressId/delete')
    deleteAddressPost(@Param('id') id: string, @Param('addressId') addressId: string) {
        return this.authService.deleteAddress(id, addressId);
    }

    @Delete('profile/:id/addresses/:addressId')
    deleteAddress(@Param('id') id: string, @Param('addressId') addressId: string) {
        return this.authService.deleteAddress(id, addressId);
    }
}
