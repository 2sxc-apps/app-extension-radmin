import { TabulatorAdapter } from "../tabulator/tabulator-adapter";
import { RadTabSetupSearch } from "../tabulator/features/radtab-setup-search";
import { SearchSpecs, SetupParams, TableSpecs } from './setup-params';
import { ServiceBase } from '../shared/service-base';
import { TableServices } from '../tabulator/table-services';
import { ErrorHelper } from '../shared/error-helper';
import { TableViewConfigurationLoader } from '../configs/table-view-configuration.loader';


export class RadminMain extends ServiceBase {
  constructor() {
    super({ name: "RadminMain", enableDebug: false });
  }

  /**
   * Create a Tabulator table based on configuration
   *
   * Note: containerId is the table element id (e.g. "radmin-id-123").
   * The ErrorHelper will attempt to render alerts into this element or into
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
      let tableConfigDataRaw;
      try {
        tableConfigDataRaw = await new TableViewConfigurationLoader(sxc).loadConfig(data.viewId);
        this.log("Loaded raw table config:", tableConfigDataRaw);
      } catch (error) {
        this.log("Failed to load table configuration:", ErrorHelper.toErrorString(error));
        ErrorHelper.handleLoadConfigError(data.tableName, error);
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
      if (tableConfigData.searchEnabled)
        new RadTabSetupSearch().createSearchInput(data as SearchSpecs);

      const servicesComplete = await services.getComplete(tableConfigData, data.viewId, linkParameters);

      try {
        this.log("Creating table with TabulatorAdapter.createTable");
        await new TabulatorAdapter().createTable(
          data as SearchSpecs & TableSpecs,
          servicesComplete,
          tableConfigData,
        );
        this.log("Table creation complete");
      } catch (error) {
        this.log("Error creating table:", ErrorHelper.toErrorString(error));
        ErrorHelper.handleCreateTableError(data.tableName, error);
      }
    } catch (error) {
      this.log("Unhandled error in setupTable:", ErrorHelper.toErrorString(error));
      ErrorHelper.showAlert(
        data.tableName,
        "Unexpected Error",
        "An unexpected error occurred while creating the table. Please check the browser console for details."
      );
    }
  }
}