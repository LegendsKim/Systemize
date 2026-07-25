export type ContactRequestSuccess = { status: 'success'; id: string };
export type ContactRequestDuplicate = { status: 'duplicate'; id: string };
export type ContactRequestValidationError = { status: 'validation_error'; errors: Record<string, string[]> };
export type ContactRequestRateLimited = { status: 'rate_limited'; retryAfterMs?: number };
export type ContactRequestError = { status: 'error'; message: string };

export type ContactRequestResult =
  | ContactRequestSuccess
  | ContactRequestDuplicate
  | ContactRequestValidationError
  | ContactRequestRateLimited
  | ContactRequestError;
