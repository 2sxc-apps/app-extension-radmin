import { ServiceBase } from '../shared/service-base';
import { TabulatorTableAdapter } from '../tabulator/tabulator-table-adapter';
import { ITableAdapter } from './ITableAdapter';

/**
 * Basic idea is to have a central service that can provide the appropriate adapter based on configuration or other factors.
 * Currently, it just returns the TabulatorTableAdapter, but in the future, it could be extended to return different adapters based on conditions.
 * 
 * This also helps to decouple the main application logic from the specific adapter implementation, making it easier to maintain and extend in the future.
 * 
 * As of now it only supports Tabulator, but it can be extended to support other table libraries by implementing additional adapters and adding logic here to return the correct one based on configuration or other factors.
 */
export class AdapterService extends ServiceBase {
  constructor() {
    super({ name: "AdapterService", enableDebug: false });
  }

  public getTableAdapter(): ITableAdapter {
    this.log("Providing TabulatorTableAdapter instance");
    return new TabulatorTableAdapter();
  }
}