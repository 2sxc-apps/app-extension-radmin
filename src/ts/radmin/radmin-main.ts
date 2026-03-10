import { TabulatorAdapter } from "../tabulator/tabulator-adapter";
import { ConfigurationLoader } from "../loaders/table-configuration-loader";
import { DataProvider } from "../providers/data-provider";
import { QueryDataProvider } from "../providers/query-data-provider";
import { TabulatorSearchFilter } from "../tabulator/tabulator-search-filter";
import { SchemaProvider } from "../providers/schema-provider";
import { CustomizeManager } from "../customizers/customize-manager";
import { ErrorMessageGenerator } from "../helpers/error-message-generator";
import { SetupParams } from './SetupParams';
import { RadminTableConfig } from '../configs/radmin-table-config';
import { Sxc } from '@2sic.com/2sxc-typings';
import { ServiceBase } from '../shared/service-base';


export class RadminMain extends ServiceBase {
  constructor() {
    super("RadminMain", true);
  }

  /**
   * Create a Tabulator table based on configuration
   *
   * Note: containerId is the table element id (e.g. "tosxc-table-123").
   * The ErrorMessageGenerator will attempt to render alerts into this element or into
   * the corresponding error container ("tosxc-table-error-123").
   */
  async setupTable(data: SetupParams): Promise<void> {
    this.log("Creating tabulator table with data:", data);

    try {
      // Initialize SXC context
      const sxc = $2sxc(data.moduleId);
      this.log("SXC context initialized for moduleId:", data.moduleId);

      // Get the CustomizeManager instance early
      const customizeManager = CustomizeManager.getInstance();
      this.log("CustomizeManager instance retrieved");

      // Try to load customizers if customizerDistPath is provided
      await customizeManager.load(data.customizerDistPath);

      // Use viewid from URL if available, otherwise use the one provided by the Razor file
      // TODO: always use razor file
      const urlParams = new URLSearchParams(window.location.search);
      const viewIdFromParams = urlParams.get("viewid");
      const viewId = viewIdFromParams ? viewIdFromParams : data.viewId;
      this.log("Using view ID:", viewId);

      // Load table configuration with ConfigurationLoader
      const configLoader = new ConfigurationLoader(sxc);
      let tableConfigDataRaw;
      try {
        tableConfigDataRaw = await configLoader.loadConfig(viewId);
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
      const tableConfigData = customizeManager.customizeConfig(tableConfigDataRaw);
      this.log("Config after customization:", tableConfigData);

      // Check for differences to see if customizations were applied
      const configChanged = JSON.stringify(tableConfigDataRaw) !== JSON.stringify(tableConfigData);
      this.log("Were config customizations applied?", configChanged);

      // Handle link parameters
      let linkParameters: string | undefined;
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
        new TabulatorSearchFilter().createFilterInput(
          data.tableName,
          data.filterName,
          data.moduleId,
          data.resources
        );
      }

      // Create the appropriate DataProvider based on the configuration
      const dataProvider: DataProvider = this.getDataProvider(tableConfigData, sxc, linkParameters);

      // Create the Tabulator adapter and SchemaProvider, then create the table
      const tabulatorAdapter = new TabulatorAdapter();
      this.log("Created TabulatorAdapter");

      const schemaProvider = new SchemaProvider(sxc);
      this.log("Created SchemaProvider");

      try {
        this.log("Creating table with TabulatorAdapter.createTable");
        await tabulatorAdapter.createTable(
          data.tableName,
          tableConfigData,
          dataProvider,
          schemaProvider,
          data.filterName,
          customizeManager,
          data.canEditConfig,
          data.canEditData,
          viewId
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


  private getDataProvider(tableConfigData: RadminTableConfig, sxc: Sxc, linkParameters: string | undefined): DataProvider {
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
