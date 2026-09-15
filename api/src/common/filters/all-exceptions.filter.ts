import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

interface ErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
  path: string;
  timestamp: string;
}

/**
 * Keeps error responses uniform and makes sure internal failures never leak
 * stack traces or driver/config details to clients in production.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body: ErrorBody = {
      statusCode: status,
      message: this.resolveMessage(exception, status),
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}${describePrismaError(exception)}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(body);
  }

  private resolveMessage(
    exception: unknown,
    status: number,
  ): string | string[] {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return payload;
      }

      const message = (payload as { message?: string | string[] }).message;
      return message ?? exception.message;
    }

    if (!this.isProduction && exception instanceof Error) {
      return exception.message;
    }

    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error'
      : 'Request failed';
  }
}

/**
 * A Prisma error's `stack` says which call failed but not why — the reason
 * lives in `code`/`meta`. Surface those so the log is actually diagnosable.
 */
function describePrismaError(exception: unknown): string {
  if (!(exception instanceof Prisma.PrismaClientKnownRequestError)) {
    return '';
  }

  return ` [prisma ${exception.code} ${JSON.stringify(exception.meta ?? {})}]`;
}
