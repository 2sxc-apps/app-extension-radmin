import { Sxc } from '@2sic.com/2sxc-typings';
import { RadminTableConfig } from '../configs/radmin-table-config';
import { DataProvider } from './data-provider';
import { QueryDataProvider } from './query-data-provider';
import { ServiceBase } from '../shared/service-base';


export class DataProviderFactory extends ServiceBase {
  constructor() {
    super("DataProviderFactory", false);
  }

  public getDataProvider(tableConfigData: RadminTableConfig, sxc: Sxc, linkParameters: string | undefined): DataProvider {
    if (tableConfigData.dataQuery === "") {
      const apiUrl = sxc.webApi.url(
        `app/auto/data/${tableConfigData.dataContentType}`
      );
      const headers = sxc.webApi.headers("GET");

      this.log("Created standard DataProvider");
      return new DataProvider(
        apiUrl,
        headers,
        tableConfigData.dataContentType
      );
    } else {
      this.log("Created QueryDataProvider");
      return new QueryDataProvider(
        sxc,
        tableConfigData.dataQuery,
        linkParameters
      );
    }
  }

}
