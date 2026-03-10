import { Sxc } from '@2sic.com/2sxc-typings';
import { RadminTableConfig } from '../configs/radmin-table-config';
import { DataProvider } from './data-provider';
import { QueryDataProvider } from './query-data-provider';
import { ServiceBase } from '../shared/service-base';

/**
 * Helper to decide if the data factory should get data from a query or from the direct REST API.
 */
export class DataProviderFactory extends ServiceBase {
  constructor() {
    super({ name: "DataProviderFactory", enableDebug: true });
  }

  public getDataProvider(tableConfigData: RadminTableConfig, sxc: Sxc, linkParameters: string | undefined): DataProvider {
    const query = tableConfigData.dataQuery;
    this.log("Creating data provider for config. Query:", query, "Link parameters:", linkParameters);
    if (query === "") {
      const apiUrl = sxc.webApi.url(`app/auto/data/${tableConfigData.dataContentType}`);
      const headers = sxc.webApi.headers("GET");

      this.log("Created standard DataProvider");
      return new DataProvider(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    }
    
    this.log("Created QueryDataProvider");
    return new QueryDataProvider(
      sxc,
      tableConfigData.dataQuery,
      linkParameters
    );
  }

}
