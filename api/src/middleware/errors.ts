import type { ErrorRequestHandler, RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    public readonly messageKey: string,
    message: string,
  ) {
    super(message);
    if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
      throw new RangeError('HttpError status must be between 400 and 599.');
    }
    this.name = 'HttpError';
  }
}

export interface SafeErrorEvent {
  event: 'request_failed';
  requestId: string;
  code: string;
  statusCode: number;
  method: string;
}
export type ErrorReporter = (event: SafeErrorEvent) => void;

const defaultReporter: ErrorReporter = (event) => console.error(JSON.stringify(event));

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new HttpError(404, 'NOT_FOUND', 'errors.notFound', 'The requested resource was not found.'));
};

function publicError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
  if (type === 'entity.parse.failed') {
    return new HttpError(400, 'INVALID_JSON', 'errors.invalidJson', 'The request body must contain valid JSON.');
  }
  if (type === 'entity.too.large') {
    return new HttpError(413, 'PAYLOAD_TOO_LARGE', 'errors.payloadTooLarge', 'The JSON request body exceeds the 16 KB limit.');
  }
  if (type === 'charset.unsupported' || type === 'encoding.unsupported') {
    return new HttpError(415, 'UNSUPPORTED_ENCODING', 'errors.unsupportedEncoding', 'The request encoding is not supported.');
  }
  return new HttpError(500, 'INTERNAL_ERROR', 'errors.internal', 'An unexpected error occurred.');
}

/** Express recognizes error middleware by its four arguments. Register it last. */
export function createErrorHandler(report: ErrorReporter = defaultReporter): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }
    const safe = publicError(error);
    const requestId = res.locals.requestId as string;
    if (safe.statusCode >= 500) {
      report({ event: 'request_failed', requestId, code: safe.code, statusCode: safe.statusCode, method: req.method });
    }
    res.status(safe.statusCode).json({
      error: { code: safe.code, messageKey: safe.messageKey, message: safe.message, requestId },
    });
  };
}
