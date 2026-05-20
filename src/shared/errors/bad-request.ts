import { DomainError } from './domain-error'

export class BadRequestError extends DomainError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST')
  }
}
