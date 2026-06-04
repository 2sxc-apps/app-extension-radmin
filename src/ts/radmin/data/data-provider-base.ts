
export abstract class DataProviderBase {

  constructor(
    protected apiUrl: string,
    protected headers: Record<string, string>,
    protected dataContentType?: string
  ) {}

  /**
   * Get the API URL
   */
  getApiUrl(): string {
    return this.apiUrl;
  }

  /**
   * Get the headers for AJAX requests
   */
  getHeaders(): Record<string, string> {
    return this.headers;
  }

  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  abstract processData(data: any): unknown;

  /**
   * Get the AJAX configuration
   */
  getAjaxConfig() {
    return {
      method: "GET",
      headers: this.headers,
    };
  }

  /**
   * Get initial data for table setup
   */
  abstract getInitialData(): Promise<unknown[]>;
}
