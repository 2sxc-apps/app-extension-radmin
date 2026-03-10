import { TabulatorAdapter } from "../tabulator/tabulator-adapter";
import { ConfigurationLoader } from "../loaders/table-configuration-loader";
import { DataProvider } from "../providers/data-provider";
import { TabulatorSearchFilter } from "../tabulator/tabulator-search-filter";
import { ErrorMessageGenerator } from "../helpers/error-message-generator";
import { SearchSpecs, SetupParams } from './setup-params';
import { ServiceBase } from '../shared/service-base';
import { TableServices } from '../tabulator/table-services';
import { DataProviderFactory } from '../providers/data-provider-factory';


export class RadminMain extends ServiceBase {
  constructor() {
    super("RadminMain", true);
  }

  /**
   * Create a Tabulator table based on configuration
   *
   * Note: containerId is the table element id (e.g. "radmin-id-123").
   * The ErrorMessageGenerator will attempt to render alerts into this element or into
   * the corresponding error container ("radmin-id-error-123").
   */
  async setup(data: SetupParams): Promise<void> {
    this.log("Creating tabulator table with data:", data);

    try {
      // Initialize SXC context
      const sxc = $2sxc(data.moduleId);
      this.log(`SXC context initialized for moduleId: ${data.moduleId}; viewId: ${data.viewId}`);

      // get shared services
      const services = new TableServices(sxc);

      // Try to load customizers if customizerDistPath is provided
      await services.customizeManager.load(data.customizerDistPath);

      // Load table configuration with ConfigurationLoader
      // const configLoader = new ConfigurationLoader(sxc);
      let tableConfigDataRaw;
      try {
        tableConfigDataRaw = await new ConfigurationLoader(sxc).loadConfig(data.viewId);
        this.log("Loaded raw table config:", tableConfigDataRaw);
      } catch (error) {
        this.log(
          "Failed to load table configuration:",
          ErrorMessageGenerator.toErrorString(error)
        );
        ErrorMessageGenerator.handleLoadConfigError(data.tableName, error);
        return;
      }

      // Apply customizations to the config
      this.log("Applying customizations to config");
      const tableConfigData = services.customizeManager.customizeConfig(tableConfigDataRaw);
      this.log("Config after customization:", tableConfigData);

      // Check for differences to see if customizations were applied
      const configChanged = JSON.stringify(tableConfigDataRaw) !== JSON.stringify(tableConfigData);
      this.log("Were config customizations applied?", configChanged);

      // Handle link parameters
      let linkParameters: string | undefined;
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has("viewconfigmode")) {
        linkParameters = undefined;
      } else {
        const linkParametersFromParams = urlParams
          .toString()
          .replace(/(^|&)viewid=[^&]*/g, "")
          .replace(/^&/, "");
        linkParameters = linkParametersFromParams
          ? linkParametersFromParams
          : undefined;
      }

      // Create the filter UI element if search is enabled
      if (tableConfigData.searchEnabled) {
        new TabulatorSearchFilter().createFilterInput(data as SearchSpecs);
      }

      // Create the appropriate DataProvider based on the configuration
      const dataProvider: DataProvider = new DataProviderFactory().getDataProvider(tableConfigData, sxc, linkParameters);

      try {
        this.log("Creating table with TabulatorAdapter.createTable");
        await new TabulatorAdapter().createTable(
          data as SearchSpecs,
          services,
          data.tableName,
          tableConfigData,
          dataProvider,
          data.canEditConfig,
          data.canEditData,
          data.viewId
        );
        this.log("Table creation complete");
      } catch (error) {
        this.log(
          "Error creating table:",
          ErrorMessageGenerator.toErrorString(error)
        );
        ErrorMessageGenerator.handleCreateTableError(data.tableName, error);
      }
    } catch (error) {
      this.log("Unhandled error in setupTable:", ErrorMessageGenerator.toErrorString(error));
      ErrorMessageGenerator.showAlert(
        data.tableName,
        "Unexpected Error",
        "An unexpected error occurred while creating the table. Please check the browser console for details."
      );
    }
  }
}