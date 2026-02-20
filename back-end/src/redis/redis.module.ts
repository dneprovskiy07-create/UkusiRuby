import { Module, Global } from '@nestjs/common';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
    providers: [
        {
            provide: REDIS_CLIENT,
            useFactory: () => {
                const redis = new Redis({
                    host: process.env.REDIS_HOST || '127.0.0.1',
                    port: parseInt(process.env.REDIS_PORT || '6379', 10),
                    password: process.env.REDIS_PASSWORD || undefined,
                    maxRetriesPerRequest: 3,
                    retryStrategy: (times) => {
                        if (times > 3) return null;
                        return Math.min(times * 200, 2000);
                    },
                });

                redis.on('error', (err) => {
                    console.error('[Redis] Connection error:', err.message);
                });

                redis.on('connect', () => {
                    console.log('[Redis] Connected');
                });

                return redis;
            },
        },
    ],
    exports: [REDIS_CLIENT],
})
export class RedisModule { }
