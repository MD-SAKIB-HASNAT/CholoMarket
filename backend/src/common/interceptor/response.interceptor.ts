import {
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

/**
 * Wraps every answer in the same envelope: `{ success, statusCode, message, data }`.
 * Controllers return `{ message, result }`; `result` becomes `data`.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    ctx: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const res = ctx.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((body) => {
        if (body instanceof StreamableFile || Buffer.isBuffer(body))
          return body as never;
        const isEnvelope = body && typeof body === 'object' && 'result' in body;
        return {
          success: true,
          statusCode: res.statusCode,
          message: isEnvelope ? (body.message ?? 'Success') : 'Success',
          data: isEnvelope ? body.result : (body ?? null),
        };
      }),
    );
  }
}
