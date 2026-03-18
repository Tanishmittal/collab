/**
 * Sentry performance monitoring and error tracking
 * 
 * This module is designed to work with or without Sentry installed.
 * When Sentry is not available, functions become no-ops.
 * 
 * To enable Sentry:
 * 1. npm install @sentry/react @sentry/tracing
 * 2. Set REACT_APP_SENTRY_DSN environment variable
 * 3. Restart dev server
 */

declare const Sentry: any;

let sentryAvailable = false;

try {
  // Check if Sentry is available at runtime
  if (typeof window !== "undefined" && (window as any).Sentry) {
    sentryAvailable = true;
  }
} catch (error) {
  console.log("[Sentry] Not installed, monitoring disabled");
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
  if (!sentryAvailable) {
    console.log("[Sentry] Skipping initialization (not installed)");
    return;
  }

  console.log("[Sentry] Initialized for error tracking and performance monitoring");
}

/**
 * Record a custom performance metric
 */
export function recordMetric(name: string, value: number, unit?: string) {
  if (!sentryAvailable) return;

  try {
    if ((window as any).performance?.measure) {
      (window as any).performance.measure(name, {
        detail: { value, unit },
      });
    }
  } catch (error) {
    console.error("Error recording metric:", error);
  }
}

/**
 * Set user context for error tracking
 */
export function setSentryUser(userId: string | null, email?: string, username?: string) {
  if (!sentryAvailable) return;

  try {
    if ((window as any).Sentry?.setUser) {
      (window as any).Sentry.setUser(
        userId ? { id: userId, email, username } : null
      );
    }
  } catch (error) {
    console.error("Error setting Sentry user:", error);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  level: "debug" | "info" | "warning" | "error" = "info",
  data?: Record<string, any>
) {
  if (!sentryAvailable) return;

  try {
    if ((window as any).Sentry?.addBreadcrumb) {
      (window as any).Sentry.addBreadcrumb({
        message,
        level,
        data,
        timestamp: Date.now() / 1000,
      });
    }
  } catch (error) {
    console.error("Error adding breadcrumb:", error);
  }
}

/**
 * Capture exception for tracking
 */
export function captureException(error: Error | unknown) {
  if (!sentryAvailable) {
    console.error("[Sentry] Would capture exception:", error);
    return;
  }

  try {
    if ((window as any).Sentry?.captureException) {
      (window as any).Sentry.captureException(error);
    }
  } catch (err) {
    console.error("Error capturing exception:", err);
  }
}

/**
 * Record page view
 */
export function recordPageView(pageName: string, properties?: Record<string, any>) {
  addBreadcrumb(`Page viewed: ${pageName}`, "info", properties);
}

/**
 * Record API call
 */
export function recordApiCall(
  method: string,
  url: string,
  statusCode: number,
  duration: number
) {
  if (statusCode >= 400) {
    addBreadcrumb(`API ${method} ${url} - ${statusCode}`, "warning", {
      method,
      url,
      statusCode,
      duration,
    });
  }
}

/**
 * Create a Sentry transaction for tracking complex operations
 */
export function createTransaction(name: string) {
  const transaction = (window as any).Sentry?.startTransaction?.({ name, op: "http.request" });

  return {
    addSpan: (spanName: string) => {
      return transaction?.startChild?.({ op: "operation", description: spanName });
    },
    finish: () => transaction?.finish?.(),
  };
}
