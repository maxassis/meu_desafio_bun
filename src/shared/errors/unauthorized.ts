import { DomainError } from './domain-error'

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED')
  }
}
