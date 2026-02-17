import { Controller, Post, Get, Put, Delete, Body, Param } from '@nestjs/common';

import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('login')
    login(@Body() body: any) {
        return this.authService.login(body);
    }

    @Post('forgot-password')
    forgotPassword(@Body() body: any) {
        console.log('Forgot Password Request Body:', body);
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    @Post('send-otp')
    sendOtp(@Body('phone') phone: string) {
        return this.authService.sendOtp(phone);
    }

    @Post('verify-otp')
    verifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
        return this.authService.verifyOtp(phone, code);
    }

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
    @Post('profile/:id/addresses/:addressId/delete') // Using POST for compatibility if needed, but DELETE is better REST practice. Sticking to user request style if any. Let's use standard REST.
    deleteAddressPost(@Param('id') id: string, @Param('addressId') addressId: string) {
        return this.authService.deleteAddress(id, addressId);
    }

    @Delete('profile/:id/addresses/:addressId')
    deleteAddress(@Param('id') id: string, @Param('addressId') addressId: string) {
        return this.authService.deleteAddress(id, addressId);
    }
}
