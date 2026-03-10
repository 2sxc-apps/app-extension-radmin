
export class ServiceBase {
  debugAll = false; // todo: enable on development builds

  constructor(private name: string, private enableDebug: boolean = false) {
  }

  /**
   * Helper method for logging when debug is enabled
   */
  public log(...args: any[]) {
    if (this.debugAll || this.enableDebug)
      console.log(`[${this.name}]`, ...args);
  }

}