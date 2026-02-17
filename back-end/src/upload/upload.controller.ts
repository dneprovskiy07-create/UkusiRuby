import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/upload')
export class UploadController {
    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads',
                filename: (_req, file, cb) => {
                    const uniqueName =
                        Date.now() + '-' + Math.round(Math.random() * 1e6);
                    cb(null, uniqueName + extname(file.originalname));
                },
            }),
            limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
            fileFilter: (_req, file, cb) => {
                if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg)$/)) {
                    cb(new BadRequestException('Только изображения (jpg, png, gif, webp)'), false);
                    return;
                }
                cb(null, true);
            },
        }),
    )
    uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('Файл не загружен');
        return {
            url: `/uploads/${file.filename}`,
            originalName: file.originalname,
            size: file.size,
        };
    }
}
