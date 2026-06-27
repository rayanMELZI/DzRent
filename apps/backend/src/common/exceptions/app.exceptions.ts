import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * AUDIT FIX B1 — @nestjs/common does NOT export TooManyRequestsException.
 * The previous code imported it from there, which fails at compile time.
 * This custom exception produces a proper 429 with our standard error envelope.
 */
export class TooManyRequestsException extends HttpException {
  constructor(message = 'Too many requests. Please slow down.') {
    super(
      { statusCode: HttpStatus.TOO_MANY_REQUESTS, error: 'TOO_MANY_REQUESTS', message },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/** 422 — a domain rule was violated (state machine, business gate, etc.) */
export class BusinessRuleException extends HttpException {
  constructor(error: string, message: string) {
    super(
      { statusCode: HttpStatus.UNPROCESSABLE_ENTITY, error, message },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
