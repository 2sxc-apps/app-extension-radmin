import { Sxc } from '@2sic.com/2sxc-typings';
import { RadminTableConfig } from '../../configs/radmin-table-config';
import { DataProviderEntities } from './data-provider-entities';
import { DataProviderQuery } from './data-provider-query';
import { ServiceBase } from '../../shared/service-base';

/**
 * Helper to decide if the data factory should get data from a query or from the direct REST API.
 */
export class DataProviderFactory extends ServiceBase {
  constructor() {
    super({ name: "DataProviderFactory", enableDebug: false });
  }

  public getDataProvider(
    tableConfigData: RadminTableConfig,
    sxc: Sxc,
    linkParameters: string | undefined
  ): DataProviderEntities | DataProviderQuery {

    // 1. WEB API ENDPOINT (highest priority)
    const webApiEndpoint = tableConfigData.dataWebApiEndpoint?.trim();
    if (webApiEndpoint) {
      this.log("Created WebApi DataProvider", webApiEndpoint);

      const apiUrl = sxc.webApi.url(webApiEndpoint);
      const headers = sxc.webApi.headers("GET");

      return new DataProviderEntities(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    }

    // 2. QUERY
    const query = tableConfigData.dataQuery;
    this.log("Creating data provider for config. Query:", query, "Link parameters:", linkParameters);

    if (query === "") {
      const apiUrl = sxc.webApi.url(`app/auto/data/${tableConfigData.dataContentType}`);
      const headers = sxc.webApi.headers("GET");

      this.log("Created standard DataProvider");
      return new DataProviderEntities(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    }

    this.log("Created QueryDataProvider");
    return new DataProviderQuery(
      sxc,
      tableConfigData,
      linkParameters
    );
  }
}