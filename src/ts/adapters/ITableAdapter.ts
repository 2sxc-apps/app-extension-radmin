import { RadminTableConfig } from '../configs/radmin-table-config';
import { SearchSpecs, TableSpecs } from '../radmin/setup-params';
import { TableServices } from '../tabulator/table-services';


export interface ITableAdapter {
  createTable(
    specs: SearchSpecs & TableSpecs,
    services: TableServices,
    tableConfigData: RadminTableConfig
  ): Promise<unknown>;
}
