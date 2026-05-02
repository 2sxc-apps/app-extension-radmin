/**
 * Base class for services, providing common functionality such as debug logging.
 * Services can extend this class to easily add debug logging capabilities.
 */
export class ServiceBase {
  // todo: enable on development builds
  debugAll = false;

  /** The name of the service, used for logging purposes */
  private name: string;

  /** Flag to enable or disable debug logging for this service */
  private enableDebug: boolean;

  constructor({ name, enableDebug }: { name: string; enableDebug?: boolean; }) {
    this.name = name;
    this.enableDebug = enableDebug ?? false;
  }

  /**
   * Helper method for logging when debug is enabled
   */
  public log(...args: any[]) {
    if (this.debugAll || this.enableDebug)
      console.log(`[${this.name}]`, ...args);
  }

  /**
   * Helper method for logging when debug is enabled and returning a value
   * @param value The value to return
   * @param args The arguments to log
   * @returns The value passed in
   */
  public logAndReturn<T>(value: T, ...args: any[]): T {
    this.log(...args);
    return value;
  }

}