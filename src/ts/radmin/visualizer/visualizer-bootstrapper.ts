import { RadminTableConfig } from '../../configs/radmin-table-config';
import { SearchSpecs, TableSpecs } from '../setup-params';
import { TableServices } from '../table-services';


export interface VisualizerBootstrapper {
  setup(
    specs: SearchSpecs & TableSpecs,
    services: TableServices,
    tableConfigData: RadminTableConfig,
  ): Promise<unknown>;
}
