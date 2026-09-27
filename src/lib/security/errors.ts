export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;

  constructor(message: string = "Validation failed", errors?: Record<string, string[]>) {
    super(message, 422, "VALIDATION_ERROR");
    this.errors = errors;
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict occurred") {
    super(message, 409, "CONFLICT");
  }
}

/**
 * Format error for safe client response without leaking sensitive internals
 */
export function formatErrorResponse(error: unknown): {
  success: false;
  error: {
    message: string;
    code: string;
    errors?: Record<string, string[]>;
  };
} {
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        ...(error instanceof ValidationError && error.errors ? { errors: error.errors } : {}),
      },
    };
  }

  // Fallback for unhandled unexpected errors
  const isDev = process.env.NODE_ENV === "development";
  console.error("Unhandled System Error:", error);

  return {
    success: false,
    error: {
      message: isDev && error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      code: "INTERNAL_SERVER_ERROR",
    },
  };
}
