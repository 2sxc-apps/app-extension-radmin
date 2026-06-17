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
  ExportModule,
  DownloadModule,
  FrozenColumnsModule,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfigService } from "./tabulator-config-service";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { RadTabSetupSearch } from "./features/radtab-setup-search";
import { RadTabRegisterSort } from "./sort/radtab-register-sort";
import { ErrorHelper } from "../shared/error-helper";
import { ServiceBase } from "../shared/service-base";
import { TableServices } from "../radmin/table-services";
import { SearchSpecs, SetupParams } from "../radmin/setup-params";
import { RadTabSetupSort } from "./sort/radtab-setup-sort";
import { RadTabSetupEditActions } from "./features/radtab-setup-edit-actions";
import { VisualizerBootstrapper } from "../radmin/visualizer/visualizer-bootstrapper";
import { RadTabSetupExport } from "./features/radtab-setup-export";
import { RadTabSetupActions, TableAction } from "./features/radtab-setup-actions";

// Tabulator modules
Tabulator.registerModule([
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  AjaxModule,
  SortModule,
  ExportModule,
  DownloadModule,
  FrozenColumnsModule,
]);

export class TabulatorTableAdapter
  extends ServiceBase
  implements VisualizerBootstrapper
{
  private configService = new TabulatorConfigService();

  constructor() {
    super({ name: "TabulatorAdapter", enableDebug: false });
  }

  async setup(
    specs: SetupParams,
    services: TableServices,
    tableConfigData: RadminTableConfig,
  ): Promise<unknown> {
    // Create the filter UI element if search is enabled
    if (tableConfigData.searchEnabled)
      new RadTabSetupSearch().createSearchInput(specs as SearchSpecs);

    return this.createTable(specs, services, tableConfigData);
  }

  async createTable(
    specs: SetupParams,
    services: TableServices,
    tableConfigData: RadminTableConfig,
  ): Promise<unknown> {
    const tableName = specs.tableName;
    try {
      this.log("createTable called", { tableName, tableConfigData });

      const tabulatorConfig = await this.configService.createTabulatorConfig(
        specs,
        tableConfigData,
        services.schema,
      );

      this.log("tabulatorConfig created", tabulatorConfig);

      // Prepare initial options (before customizations)
      const dataProvider = services.dataProvider; // Use the data provider from servicesComplete, which may have customizations
      
      const ajaxOptions: Options = {
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (_url, _params, response) =>
          dataProvider.processData(response),
      };

      const tabulatorOptionsRaw: Options & {
        dependencies: Record<string, unknown>;
      } = {
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

      // Setup Action Menu
      const actions: TableAction[] = [];

      const exportSetup = new RadTabSetupExport();

      if (tableConfigData.enableExport) {
        const fileName =
          `${tableConfigData.title} ${new Date().toISOString().slice(0, 10)}.csv`;

        actions.push(
          exportSetup.createAction(table, specs, fileName)
        );
      }

      new RadTabSetupActions().setup(specs.actionsContainerId, actions);


      // Setup Sort
      new RadTabSetupSort().setupInitialSort(
        table,
        tabulatorOptions,
        tableName,
      );

      if (specs.searchDomId && tableConfigData.searchEnabled) {
        this.log("setting up filter input", specs.searchDomId);
        new RadTabSetupSearch().connectSearch(table, specs.searchDomId);
      }

      new RadTabSetupEditActions().setupEditAddDelete(
        table,
        tableConfigData,
        specs,
      );

      return table;
    } catch (error) {
      console.error(
        "Failed to create Tabulator table:",
        ErrorHelper.toErrorString(error),
      );
      throw error; // Re-throw to allow parent to handle specific errors
    }
  }
}
