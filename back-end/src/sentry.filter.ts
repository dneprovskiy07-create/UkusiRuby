import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { Response, Request } from 'express';

@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // Only capture 5xx errors to Sentry (not client errors like 400, 401, 404)
        if (status >= 500) {
            Sentry.captureException(exception, {
                extra: {
                    url: request.url,
                    method: request.method,
                    body: request.body,
                },
            });
        }

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : { message: 'Internal server error', statusCode: status };

        response.status(status).json(
            typeof message === 'string'
                ? { message, statusCode: status }
                : message,
        );
    }
}
