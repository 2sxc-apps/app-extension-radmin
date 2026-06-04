import { DataProviderBase } from './data-provider-base';

export class DataProviderWebApi extends DataProviderBase {

  constructor(
    apiUrl: string,
    headers: Record<string, string>
  ) {
    super(apiUrl, headers);
  }

  async getInitialData(): Promise<unknown[]> {
    try {
      const response = await fetch(this.apiUrl, this.getAjaxConfig());
      console.log(`2pp[res]: ${response}`);
      return await response.json();
    } catch (error) {
      console.error("WebApiProvider error:", error);
      return [];
    }
  }

  processData(data: any): unknown {
    if (!Array.isArray(data)) return data;

    return data.map(row => {
      const obj: any = {};
      Object.keys(row).forEach(k => {
        obj[k.charAt(0).toLowerCase() + k.slice(1)] = row[k];
      });
      return obj;
    });
  }
}