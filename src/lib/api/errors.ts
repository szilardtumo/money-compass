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

export class MissingSubaccountError extends Error {
  constructor(subaccountId: string) {
    super(`Missing subaccount with ID: ${subaccountId}`);
    this.name = 'MissingSubaccountError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class GocardlessError extends Error {
  constructor(error: unknown) {
    super(error instanceof Error ? error.message : 'Unknown error');
    this.name = 'GocardlessError';
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
