import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  Options,
  AjaxModule,
  SortModule,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfigService } from "./tabulator-config-service";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { RadTabSetupSearch } from "./features/radtab-setup-search";
import { RadTabRegisterSort } from "./sort/radtab-register-sort";
import { ErrorHelper } from "../helpers/error-helper";
import { ServiceBase } from '../shared/service-base';
import { TableServicesComplete } from './table-services';
import { SearchSpecs, TableSpecs } from '../radmin/setup-params';
import { RadTabSetupSort } from './sort/radtab-setup-sort';
import { RadTabSetupEditActions } from './features/radtab-setup-edit-actions';

// Register required modules for Tabulator
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  AjaxModule,
  SortModule,
]);

export class TabulatorAdapter extends ServiceBase {
  private configService = new TabulatorConfigService();

  constructor() {
    super({ name: "TabulatorAdapter", enableDebug: false });
  }

  async createTable(
    specs: SearchSpecs & TableSpecs,
    services: TableServicesComplete,
    tableConfigData: RadminTableConfig,
  ) {
    const tableName = specs.tableName;
    try {
      this.log("createTable called", { tableName, tableConfigData });

      const tabulatorConfig = await this.configService.createTabulatorConfig(specs, tableConfigData, services.schema);
      this.log("tabulatorConfig created", tabulatorConfig);

      // Prepare initial options (before customizations)
      const dataProvider = services.dataProvider; // Use the data provider from servicesComplete, which may have customizations
      
      const ajaxOptions: Options = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (_url, _params, response) => dataProvider.processData(response),
      };

      const tabulatorOptionsRaw: Options & { dependencies: Record<string, unknown> } = {
        columnDefaults: {
          maxWidth: 300,
        },
        ...ajaxOptions,
        ...tabulatorConfig,
        dependencies: {
          // include Luxon DateTime for use in formatters and other custom functions
          // see https://tabulator.info/docs/6.3/dependencies#luxon
          DateTime, 
        },
      };
      this.log("tabulatorOptionsRaw", tabulatorOptionsRaw);

      // Check if the customizer has any adjustments to make
      const tabulatorOptions = services.customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );
      this.log("tabulatorOptions after customization", tabulatorOptions);

      // Ensure our custom object sorter is registered BEFORE creating the table
      new RadTabRegisterSort().registerSortObjectAndArray();

      const table = new Tabulator(`#${tableName}`, tabulatorOptions);
      this.log("Tabulator instance created", table);

      // Apply initialSort after data has loaded (avoid calling setSort too early).
      new RadTabSetupSort().setupInitialSort(table, tabulatorOptions, tableName);

      if (specs.searchDomId && tableConfigData.searchEnabled) {
        this.log("setting up filter input", specs.searchDomId);
        new RadTabSetupSearch().connectSearch(table, specs.searchDomId);
      }

      new RadTabSetupEditActions().setupEditAddDelete(table, tableConfigData, specs);

      return table;
    } catch (error) {
      console.error(
        "Failed to create Tabulator table:",
        ErrorHelper.toErrorString(error)
      );
      throw error; // Re-throw to allow parent to handle specific errors
    }
  }

}
