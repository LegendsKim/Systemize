import { ProviderErrorCategory, categorizeHttpError, categorizeNetworkError } from './provider-errors';

export const BASE_RETRY_DELAY_MS = 1000;

export interface FetchOptions extends RequestInit {
  timeoutMs: number;
  maxRetries?: number; // Default: 3
  retryableStatuses?: number[]; // Default: [429, 502, 503, 504]
  isIdempotent?: boolean; // Default: false for mutations
}

export interface FetchResult<T> {
  ok: boolean;
  data?: T;
  status: number;
  error?: {
    category: ProviderErrorCategory;
    message: string;
    retryAfterMs?: number;
  };
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  
  // Try parsing as seconds
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000;
  }
  
  // Try parsing as date
  const date = Date.parse(header);
  if (!isNaN(date)) {
    return Math.max(0, date - Date.now());
  }
  
  return undefined;
}

export async function fetchWithRetry<T>(url: string, options: FetchOptions): Promise<FetchResult<T>> {
  const maxRetries = options.maxRetries ?? 3;
  const retryableStatuses = options.retryableStatuses ?? [429, 502, 503, 504];
  
  // Default isIdempotent to false for mutating methods, true for GET/HEAD/OPTIONS
  const method = options.method?.toUpperCase() || 'GET';
  const isIdempotent = options.isIdempotent ?? ['GET', 'HEAD', 'OPTIONS'].includes(method);
  
  let attempt = 0;
  
  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
    
    // Merge standard AbortSignal with our timeout controller if one was provided
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      if (response.ok) {
        // Try parsing JSON or falling back to text
        const contentType = response.headers.get('content-type') || '';
        let data: unknown;
        
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text();
        }
        
        return {
          ok: true,
          data: data as T,
          status: response.status,
        };
      }
      
      const category = categorizeHttpError(response.status);
      const retryAfterMs = parseRetryAfter(response.headers.get('retry-after'));
      
      const shouldRetry = 
        attempt < maxRetries && 
        isIdempotent && 
        retryableStatuses.includes(response.status);
        
      if (!shouldRetry) {
        return {
          ok: false,
          status: response.status,
          error: {
            category,
            message: `HTTP Error: ${response.status}`,
            retryAfterMs,
          },
        };
      }
      
      // Calculate delay: respect Retry-After header or fallback to exponential backoff
      const jitter = Math.random() * 500;
      const delayMs = retryAfterMs ?? (BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + jitter);
      
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      
    } catch (error: unknown) {
      const category = categorizeNetworkError(error);
      
      const isAbortError = error instanceof Error && error.name === 'AbortError';
      // Only retry timeouts (abort due to timeout controller) if it's idempotent
      const isTimeoutAbort = isAbortError && !options.signal?.aborted;
      
      const shouldRetry = 
        attempt < maxRetries && 
        isIdempotent && 
        (category === 'transient_failure' || isTimeoutAbort);
        
      if (!shouldRetry) {
        return {
          ok: false,
          status: 0, // Network error
          error: {
            category,
            message: error instanceof Error ? error.message : 'Unknown network error',
          },
        };
      }
      
      const jitter = Math.random() * 500;
      const delayMs = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + jitter;
      
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
