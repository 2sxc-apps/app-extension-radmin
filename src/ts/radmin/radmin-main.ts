import { TabulatorAdapter } from "../tabulator/tabulator-adapter";
import { ConfigurationLoader } from "../loaders/table-configuration-loader";
import { DataProvider } from "../providers/data-provider";
import { QueryDataProvider } from "../providers/query-data-provider";
import { TabulatorSearchFilter } from "../tabulator/tabulator-search-filter";
import { SchemaProvider } from "../providers/schema-provider";
import { CustomizeManager } from "../customizers/customize-manager";
import { ErrorMessageGenerator } from "../helpers/error-message-generator";
import { SetupParams } from './SetupParams';


export class RadminMain {
  debug = false;

  /**
   * Helper method for logging when debug is enabled
   */
  private log(...args: any[]) {
    if (this.debug) console.log("[RadminMain]", ...args);
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
      // Get the CustomizeManager instance early
      const customizeManager = CustomizeManager.getInstance();
      this.log("CustomizeManager instance retrieved");

      const sxc = $2sxc(data.moduleId);
      this.log("SXC context initialized for moduleId:", data.moduleId);

      // Only try to load customizers if customizerDistPath is provided
      if (data.customizerDistPath) {
        try {
          this.log("Using app URL for customizers:", data.customizerDistPath);

          // Create full URL with cache-busting parameter for development
          const timestamp = new Date().getTime();
          const distPath = `${data.customizerDistPath}?v=${timestamp}`;

          this.log("Attempting to load customizers from:", distPath);

          try {
            const preloadLink = document.createElement("link");
            preloadLink.rel = "modulepreload";
            preloadLink.href = distPath;
            document.head.appendChild(preloadLink);

            const importResult = await import(
              /* webpackIgnore: true */ distPath
            );

            this.log(
              "Import successful, module keys:",
              Object.keys(importResult)
            );
            this.log("Module content:", importResult);

            if (importResult && Array.isArray(importResult.customizers)) {
              const customizerClasses = importResult.customizers;

              const customizerInstances = customizerClasses
                .map((CustomizerClass: any) => {
                  try {
                    const instance = new CustomizerClass();
                    this.log(
                      `Instantiated customizer: ${instance.constructor.name}`
                    );
                    return instance;
                  } catch (error) {
                    this.log(`Error instantiating customizer:`, error);
                    return null;
                  }
                })
                .filter(Boolean);

              if (customizerInstances.length) {
                this.log(
                  `Registering ${customizerInstances.length} user customizers`
                );
                customizeManager.registerCustomizers(customizerInstances);
                this.log(`Customizers registered successfully`);
              }
            } else {
              this.log("No valid customizers array found in imported module");
              this.log("Available exports:", Object.keys(importResult));
            }
          } catch (error) {
            this.log(
              `Error during dynamic import:`,
              ErrorMessageGenerator.toErrorString(error)
            );
          }
        } catch (error) {
          this.log(
            "Failed to load user customizers:",
            ErrorMessageGenerator.toErrorString(error)
          );
          console.warn("Failed to load user customizers:", error);
        }
      } else {
        this.log("No customizerDistPath provided, skipping customizer loading");
      }

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
      const tableConfigData =
        customizeManager.customizeConfig(tableConfigDataRaw);
      this.log("Config after customization:", tableConfigData);

      // Check for differences to see if customizations were applied
      const configChanged =
        JSON.stringify(tableConfigDataRaw) !== JSON.stringify(tableConfigData);
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

      // Create the filter input if search is enabled
      if (tableConfigData.searchEnabled) {
        const searchFilter = new TabulatorSearchFilter();
        searchFilter.createFilterInput(
          data.tableName,
          data.filterName,
          data.moduleId,
          data.resources
        );
      }

      // Create the Tabulator adapter
      const tabulatorAdapter = new TabulatorAdapter();
      this.log("Created TabulatorAdapter");

      let dataProvider: DataProvider;

      if (tableConfigData.dataQuery === "") {
        const apiUrl = sxc.webApi.url(
          `app/auto/data/${tableConfigData.dataContentType}`
        );
        const headers = sxc.webApi.headers("GET");

        dataProvider = new DataProvider(
          apiUrl,
          headers,
          tableConfigData.dataContentType
        );
        this.log("Created standard DataProvider");
      } else {
        dataProvider = new QueryDataProvider(
          sxc,
          tableConfigData.dataQuery,
          linkParameters
        );
        this.log("Created QueryDataProvider");
      }

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
      this.log(
        "Unhandled error in setupTable:",
        ErrorMessageGenerator.toErrorString(error)
      );
      ErrorMessageGenerator.showAlert(
        data.tableName,
        "Unexpected Error",
        "An unexpected error occurred while creating the table. Please check the browser console for details."
      );
    }
  }
}
