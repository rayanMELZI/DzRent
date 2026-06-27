import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

/**
 * Error response envelope sent to all clients.
 * Keeping the shape consistent makes frontend error handling trivial.
 */
interface ErrorResponse {
  success: false;
  statusCode: number;
  /** Machine-readable error code for i18n / client branching */
  error: string;
  /** Human-readable message(s). Array when validation produces multiple errors. */
  message: string | string[];
  /** ISO 8601 timestamp in UTC */
  timestamp: string;
  path: string;
}

/**
 * HttpExceptionFilter catches ALL exceptions thrown anywhere in the NestJS
 * request lifecycle (controllers, services, guards, interceptors).
 *
 * Prisma errors are translated to meaningful HTTP status codes so API consumers
 * never see raw database error messages (which would leak implementation details).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, message } = this.resolveException(exception);

    // Log 5xx errors with stack trace; 4xx are expected user errors
    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} → ${status} ${message}`);
    }

    const body: ErrorResponse = {
      success: false,
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(body);
  }

  private resolveException(exception: unknown): {
    status: number;
    error: string;
    message: string | string[];
  } {
    // ── NestJS HTTP exceptions (e.g. thrown with new BadRequestException()) ─
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        return {
          status,
          error: (resObj['error'] as string) ?? HttpStatus[status],
          message: (resObj['message'] as string | string[]) ?? exception.message,
        };
      }

      return {
        status,
        error: HttpStatus[status] ?? 'HTTP_ERROR',
        message: typeof res === 'string' ? res : exception.message,
      };
    }

    // ── Prisma known errors ───────────────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    // ── Prisma validation errors ──────────────────────────────────────────
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'VALIDATION_ERROR',
        message: 'Invalid data supplied to the database layer.',
      };
    }

    // ── Unhandled / unknown errors ────────────────────────────────────────
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    };
  }

  private resolvePrismaError(e: Prisma.PrismaClientKnownRequestError): {
    status: number;
    error: string;
    message: string;
  } {
    switch (e.code) {
      case 'P2002': {
        // Unique constraint violation
        const fields = (e.meta?.['target'] as string[])?.join(', ') ?? 'field';
        return {
          status: HttpStatus.CONFLICT,
          error: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `A record with this ${fields} already exists.`,
        };
      }
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          error: 'RECORD_NOT_FOUND',
          message: 'The requested record was not found.',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'FOREIGN_KEY_VIOLATION',
          message: 'A related record required for this operation does not exist.',
        };
      case 'P2034':
        return {
          status: HttpStatus.CONFLICT,
          error: 'WRITE_CONFLICT',
          message: 'Transaction conflict — please retry the request.',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'DATABASE_ERROR',
          message: 'A database error occurred.',
        };
    }
  }
}
