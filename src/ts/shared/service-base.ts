
export class ServiceBase {
  debugAll = false; // todo: enable on development builds
  private name: string;
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

}