export type ProviderErrorCategory =
  | 'invalid_request'
  | 'unauthorized'
  | 'rate_limited'
  | 'timeout'
  | 'transient_failure'
  | 'permanent_rejection';

export function categorizeHttpError(status: number): ProviderErrorCategory {
  if (status === 400 || status === 422) return 'invalid_request';
  if (status === 401 || status === 403) return 'unauthorized';
  if (status === 429) return 'rate_limited';
  if (status === 408) return 'timeout';
  if (status >= 500 && status <= 599) return 'transient_failure';
  
  return 'permanent_rejection';
}

export function categorizeNetworkError(error: unknown): ProviderErrorCategory {
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.message.toLowerCase().includes('timeout')) {
      return 'timeout';
    }
    if (error.message.toLowerCase().includes('network') || error.message.toLowerCase().includes('fetch')) {
      return 'transient_failure';
    }
  }
  return 'permanent_rejection';
}
