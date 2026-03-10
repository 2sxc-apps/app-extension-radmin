/**
 * Small helper to centralize error handling and UI alerts.
 * - safeErrorString converts unknown -> string for logs/messages
 * - isAuthError detects HTTP 401-ish errors
 * - showAlert renders a bootstrap alert into the table's container (or error container)
 * - convenience handlers for config/load/create errors
 */
export class ErrorHelper {
  /**
   * Convert unknown error into a safe string for logging and UI.
   */
  static toErrorString(err: unknown): string {
    try {
      if (err === undefined) return "undefined";
      if (err === null) return "null";
      if (typeof err === "string") return err;
      if (err instanceof Error) return err.message || String(err);
      // Some libraries attach status/message
      const anyErr = err as any;
      if (typeof anyErr === "object") {
        if (typeof anyErr.message === "string") return anyErr.message;
        if (typeof anyErr.toString === "function") return anyErr.toString();
        try {
          return JSON.stringify(anyErr);
        } catch {
          return String(anyErr);
        }
      }
      return String(err);
    } catch (e) {
      return "unknown error";
    }
  }

  /**
   * Quick heuristic to detect authentication/401 errors.
   * Accepts plain error strings, objects with `.status`, and Error instances.
   */
  static isAuthError(err: unknown): boolean {
    try {
      // object with status property
      if (typeof err === "object" && err !== null) {
        const anyErr = err as any;
        if (typeof anyErr.status === "number" && anyErr.status === 401) return true;
        // some libs use statusCode
        if (typeof anyErr.statusCode === "number" && anyErr.statusCode === 401) return true;
      }

      // string includes 401
      const s = ErrorHelper.toErrorString(err);
      return s.includes("401") || /unauthori(s|z)ed/i.test(s);
    } catch {
      return false;
    }
  }

  /**
   * Render a Bootstrap alert into the target container.
   *
   * containerId: typically the table id (e.g. 'radmin-id-123'). If an element with that id isn't found
   * the helper will attempt to use an error container id variant by replacing the prefix:
   *  radmin-id-123 -> radmin-id-error-123
   */
  static showAlert(
    containerId: string,
    title: string,
    message: string,
    type: "danger" | "warning" = "danger"
  ): void {
    try {
      const container = document.getElementById(containerId);
      const errorContainerId = containerId.replace(/^radmin-id-/, "radmin-id-error-");
      const errorContainer = document.getElementById(errorContainerId);
      const target = errorContainer || container;
      if (!target) {
        // nothing to render into — fallback to console
        console.warn("ErrorHelper.showAlert: no target container found for", containerId, errorContainerId);
        console.warn(`${title}: ${message}`);
        return;
      }

      // Clear existing content so the alert is prominent
      target.innerHTML = "";

      const alert = document.createElement("div");
      alert.className = `alert alert-${type} alert-dismissible fade show`;
      alert.setAttribute("role", "alert");
      alert.innerHTML = `
        <h4 class="alert-heading" style="margin-top:0;margin-bottom:.25rem;">${title}</h4>
        <div>${message}</div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      `;
      target.appendChild(alert);
    } catch (e) {
      console.error("ErrorHelper.showAlert failed:", e);
    }
  }

  /**
   * Show a friendly message for configuration load failures (e.g. 401s).
   * containerId should be the table container id (e.g. 'radmin-id-123').
   */
  static handleLoadConfigError(containerId: string, err: unknown) {
    const errStr = ErrorHelper.toErrorString(err);
    if (ErrorHelper.isAuthError(err)) {
      ErrorHelper.showAlert(
        containerId,
        "Authentication Required",
        "You need to be logged in to view this table.",
        "warning"
      );
    } else {
      ErrorHelper.showAlert(
        containerId,
        "Configuration Error",
        `Failed to load table configuration. ${errStr}`
      );
    }
  }

  /**
   * Show a friendly message for table creation / data/schema errors.
   */
  static handleCreateTableError(containerId: string, err: unknown) {
    const errStr = ErrorHelper.toErrorString(err);

    // Specific detection for missing/invalid schema payloads
    if (/schema/i.test(errStr) || errStr.includes("Cannot read properties of undefined")) {
      ErrorHelper.showAlert(
        containerId,
        "Schema Error",
        "Failed to load schema data. This often happens when you're not logged in or don't have appropriate permissions."
      );
      return;
    }

    if (ErrorHelper.isAuthError(err)) {
      ErrorHelper.showAlert(
        containerId,
        "Authentication Required",
        "You need to be logged in to access this data.",
        "warning"
      );
      return;
    }

    // generic fallback
    ErrorHelper.showAlert(
      containerId,
      "Table Creation Error",
      `There was a problem creating the table. ${errStr}`
    );
  }
}