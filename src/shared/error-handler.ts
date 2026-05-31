import { type ErrorHandler, ValidationError } from 'elysia'
import { ZodError } from 'zod'

import { DomainError } from './errors/domain-error'
import { zodErrorResponse } from './zod-error-response'

export const errorHandler: ErrorHandler = ({ error, set }) => {
  if (error instanceof ValidationError) {
    set.status = 400
    return error.toResponse()
  }

  if (error instanceof ZodError) {
    set.status = 400
    return zodErrorResponse(error)
  }

  if (error instanceof DomainError) {
    set.status = error.statusCode
    return {
      message: error.message,
      code: error.code,
    }
  }

  console.error('Unhandled error:', error)
  set.status = 500
  return {
    message: 'Internal server error',
    code: 'INTERNAL_SERVER_ERROR',
  }
}
