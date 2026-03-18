/**
 * Global error handling utilities
 * Provides centralized error handling for API calls, validation, etc.
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    public errors: Record<string, string[]>
  ) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Handle errors consistently across the app
 * Logs to console and monitoring service
 */
export function handleError(error: unknown): {
  message: string;
  code?: string;
  isDev: boolean;
} {
  const isDev = process.env.NODE_ENV === 'development';

  if (error instanceof ApiError) {
    console.error(`API Error [${error.statusCode}]:`, error.message);
    return {
      message: error.message,
      code: error.statusCode.toString(),
      isDev,
    };
  }

  if (error instanceof ValidationError) {
    console.error('Validation Error:', error.errors);
    return {
      message: 'Please check your inputs',
      code: 'VALIDATION_ERROR',
      isDev,
    };
  }

  if (error instanceof Error) {
    console.error('Error:', error.message);
    return {
      message: isDev ? error.message : 'An error occurred',
      isDev,
    };
  }

  console.error('Unknown error:', error);
  return {
    message: 'An unexpected error occurred',
    isDev,
  };
}

/**
 * Retry failed requests with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError || new Error('Max retries reached');
}

/**
 * Safe wrapper for async operations
 * Returns result or error in consistent format
 */
export async function safeAsync<T>(
  fn: () => Promise<T>
): Promise<SuccessResponse<T> | ErrorResponse> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    const { message, code } = handleError(error);
    return { success: false, error: message, code };
  }
}

/**
 * Create a user-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    switch (error.statusCode) {
      case 400:
        return 'Invalid input. Please check your data.';
      case 401:
        return 'You need to sign in.';
      case 403:
        return 'You do not have permission to do that.';
      case 404:
        return 'The resource was not found.';
      case 409:
        return 'A conflict occurred. This item may already exist.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    // Handle common error patterns
    if (error.message.includes('network')) return 'Network connection error. Check your internet.';
    if (error.message.includes('timeout')) return 'Request timed out. Please try again.';
    if (error.message.includes('quota')) return 'Rate limit exceeded. Please try again later.';
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}
