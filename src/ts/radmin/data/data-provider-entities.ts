import { DataProviderBase } from './data-provider-base';

export class DataProviderEntities extends DataProviderBase {

  constructor(
    apiUrl: string,
    headers: Record<string, string>,
    dataContentType?: string
  ) {
    super(apiUrl, headers, dataContentType);
  }

  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  processData(data: any): unknown {
    // For arrays (normal content-type data), normalize keys to lowerCamelCase
    if (Array.isArray(data)) {
      return data.map((row: any) => {
        const newRow: any = {};
        Object.entries(row).forEach(([key, value]) => {
          const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
          newRow[camelKey] = value;
        });
        return newRow;
      });
    }
    // For all other cases (leave as is)
    return data;
  }


  /**
   * Get initial data for table setup
   */
  async getInitialData() {
    try {
      const response = await fetch(this.apiUrl, this.getAjaxConfig());
      return await response.json();
    } catch (error) {
      console.error("Error fetching initial data:", error);
      return [];
    }
  }
}
