import { RadminTableConfig } from '../configs/radmin-table-config';
import { SearchSpecs, TableSpecs } from '../radmin/setup-params';
import { TableServices } from '../radmin/table-services';


export interface ITableAdapter {
  setup(
    specs: SearchSpecs & TableSpecs,
    services: TableServices,
    tableConfigData: RadminTableConfig,
  ): Promise<unknown>;
  
  createTable(
    specs: SearchSpecs & TableSpecs,
    services: TableServices,
    tableConfigData: RadminTableConfig
  ): Promise<unknown>;
}
