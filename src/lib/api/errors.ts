export class DatabaseError extends Error {
  constructor(
    message: string,
    public originalError?: unknown,
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class MissingExchangeRateError extends Error {
  constructor(currency: string) {
    super(`Missing exchange rate for currency: ${currency}`);
    this.name = 'MissingExchangeRateError';
  }
}

/** An error with a message meant for the user. Actions show its message instead of a generic one. */
export class UserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(
      `${resource[0].toUpperCase()}${resource.slice(1)}${id ? ` with ID ${id}` : ''} not found`,
    );
    this.name = 'NotFoundError';
  }
}
