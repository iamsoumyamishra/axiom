import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { FastifyReply } from 'fastify';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const responseBody = exceptionResponse as Record<string, unknown>;

    const errorBody = {
      success: false,
      error: {
        code: HttpStatus[status],
        message: typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (responseBody['message'] ?? 'An error occurred'),
        details: typeof exceptionResponse === 'object'
          ? (responseBody['errors'] as Record<string, string[]> | undefined)
          : undefined,
      },
    };

    response.status(status).send(errorBody);
  }
}
