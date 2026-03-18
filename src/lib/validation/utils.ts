import { ZodSchema, ZodError } from 'zod';

/**
 * Validation utilities for forms
 * Provides helper functions to validate data and handle errors
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate data against a Zod schema
 * Returns array of validation errors or empty if valid
 */
export function validateData<T>(
  data: unknown,
  schema: ZodSchema
): ValidationError[] {
  try {
    schema.parse(data);
    return [];
  } catch (error) {
    if (error instanceof ZodError) {
      return error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
    }
    return [{ field: 'unknown', message: 'Validation failed' }];
  }
}

/**
 * Validate data and extract typed result
 * Throws if invalid, returns typed data if valid
 */
export function validateAndParse<T>(
  data: unknown,
  schema: ZodSchema<T>
): T {
  return schema.parse(data) as T;
}

/**
 * Create error map from validation errors
 * Useful for setting form errors
 */
export function createErrorMap(
  errors: ValidationError[]
): Record<string, string> {
  return Object.fromEntries(
    errors.map(err => [err.field, err.message])
  );
}

/**
 * Safe validator that returns validation result instead of throwing
 */
export function safeValidate<T>(
  data: unknown,
  schema: ZodSchema<T>
): { success: boolean; data?: T; errors?: ValidationError[] } {
  try {
    const parsed = schema.parse(data);
    return { success: true, data: parsed };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      };
    }
    return {
      success: false,
      errors: [{ field: 'unknown', message: 'Validation failed' }],
    };
  }
}
