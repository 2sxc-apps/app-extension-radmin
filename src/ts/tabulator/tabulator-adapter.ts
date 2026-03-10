import {
  Tabulator,
  TooltipModule,
  FormatModule,
  PageModule,
  InteractionModule,
  FilterModule,
  Options,
  AjaxModule,
  ColumnComponent,
  RowComponent,
  SortModule,
  Sorter,
} from "tabulator-tables";
import { DateTime } from "luxon";
import { TabulatorConfigService } from "./tabulator-config-service";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { TabulatorSearchFilter } from "./tabulator-search-filter";
import { SetupObjectSorter } from "../helpers/setup-object-sorter";
import { ErrorHelper } from "../helpers/error-helper";
import { TabulatorToolbars } from "./tabulator-toolbars/tabulator-toolbar";
import { ServiceBase } from '../shared/service-base';
import { TableServicesComplete } from './table-services';
import { SearchSpecs, TableSpecs } from '../radmin/setup-params';

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

// Define an extended options interface to include custom properties
interface ExtendedOptions extends Options {
  dependencies?: { DateTime: typeof DateTime };
}

export class TabulatorAdapter extends ServiceBase {
  private tabulatorToolbars = new TabulatorToolbars();
  private configService = new TabulatorConfigService();

  constructor() {
    super({ name: "TabulatorAdapter", enableDebug: false });
  }

  private setupFilterInput(table: Tabulator, filterName: string) {
    const searchFilter = new TabulatorSearchFilter();
    const filterInput = searchFilter.getFilterFunction(filterName);
    if (!filterInput) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };
    const onInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      table.setFilter(searchFilter.matchAny, { value });
    };

    filterInput.addEventListener("keydown", onKeyDown);
    filterInput.addEventListener("input", onInput);
    this.log("Filter input wired", filterName);
  }

  async createTable(
    specs: SearchSpecs & TableSpecs,
    services: TableServicesComplete,
    tableConfigData: RadminTableConfig,
  ) {
    const tableName = specs.tableName;
    try {
      this.log("createTable called", { tableName, tableConfigData });

      const tabulatorConfig: Partial<Options> =
        await this.configService.createTabulatorConfig(tableConfigData, services.schema);
      this.log("tabulatorConfig created", tabulatorConfig);

      const savedSortersJson = sessionStorage.getItem(`${tableName}-sorters`);
      if (savedSortersJson) {
        try {
          const savedSorters = JSON.parse(savedSortersJson);
          if (Array.isArray(savedSorters) && savedSorters.length > 0) {
            tabulatorConfig.initialSort = savedSorters;
            this.log(`Loaded saved sorters for ${tableName}`, savedSorters);
          }
        } catch (err) {
          this.log(`Failed to parse saved sorters for ${tableName}`, err);
        }
      }

      const dataProvider = services.dataProvider; // Use the data provider from servicesComplete, which may have customizations
      const tabulatorOptionsRaw: ExtendedOptions = {
        columnDefaults: {
          maxWidth: 300,
        },
        ajaxURL: dataProvider.getApiUrl(),
        ajaxConfig: {
          method: "GET",
          headers: dataProvider.getHeaders(),
        },
        ajaxResponse: (_url, _params, response) =>
          dataProvider.processData(response),
        ...tabulatorConfig,
        dependencies: { DateTime },
      };
      this.log("tabulatorOptionsRaw", tabulatorOptionsRaw);

      const tabulatorOptions = services.customizeManager.customizeTabulator(
        tabulatorOptionsRaw,
        tableConfigData.guid
      );
      this.log("tabulatorOptions after customization", tabulatorOptions);

      // Ensure our custom object sorter is registered BEFORE creating the table
      const sorter = new SetupObjectSorter();
      sorter.Sort();

      const table = new Tabulator(`#${tableName}`, tabulatorOptions);
      this.log("Tabulator instance created", table);

      // Apply initialSort after data has loaded (avoid calling setSort too early).
      try {
        // accept either shape so we are resilient: { field, dir } or { column, dir }
        const initialSortRaw = (tabulatorOptions as any).initialSort as
          | Array<{ field?: string; column?: string; dir: "asc" | "desc" }>
          | undefined;

        if (initialSortRaw && initialSortRaw.length) {
          // normalize into Tabulator Sorter[] (must include 'column')
          const initialSort = initialSortRaw.map((s) => ({
            column: s.column ?? s.field ?? "",
            dir: s.dir,
          })) as Sorter[];

          this.log("initialSort provided (for Tabulator)", initialSort);

          // apply only after dataLoaded to avoid early pipelines errors
          table.on("dataLoaded", () => {
            this.log("dataLoaded event — applying initialSort", initialSort);
            try {
              table.setSort(initialSort);
            } catch (error) {
              this.log("setSort on dataLoaded failed:", ErrorHelper.toErrorString(error));
            }

            table.on("dataSorted", function (sorters, rows) {
              if (sorters.length === 0)
                return;

              const cleanSorters = sorters.map((s) => ({
                field: s.field || s.column.getField(),
                dir: s.dir,
              }));

              sessionStorage.setItem(
                `${tableName}-sorters`,
                JSON.stringify(cleanSorters)
              );
            });
          });
        }
      } catch (error) {
        this.log(
          "error scheduling initialSort application:",
          ErrorHelper.toErrorString(error)
        );
      }

      if (specs.searchDomId && tableConfigData.searchEnabled) {
        this.log("setting up filter input", specs.searchDomId);
        this.setupFilterInput(table, specs.searchDomId);
      }

      if (this.isViewConfigMode() && specs.canEditConfig) {
        this.log("in ViewConfigMode, setting up header handlers");
        this.setupViewConfigMode(table, tableConfigData);
      } else if (specs.canEditData) {
        const editEnabled = !!tableConfigData.enableEdit;
        const canDelete = !!tableConfigData.enableDelete;
        this.log("row actions", { editEnabled, canDelete });
        if (editEnabled || canDelete) {
          this.setupRowActionsHover(table, editEnabled, canDelete);
        }
        if (tableConfigData.enableAdd) {
          this.log("enabling row add mode");
          this.setupRowAddMode(table, tableConfigData);
        }
      }

      return table;
    } catch (error) {
      console.error(
        "Failed to create Tabulator table:",
        ErrorHelper.toErrorString(error)
      );
      throw error; // Re-throw to allow parent to handle specific errors
    }
  }

  isViewConfigMode(): boolean {
    const url = window.location.href.toLowerCase();
    const qp = new URLSearchParams(window.location.search)
      .get("viewconfigmode")
      ?.toLowerCase();
    return qp === "true" || url.includes("viewconfigmode/true");
  }

  private setupViewConfigMode(
    table: Tabulator,
    tableConfigData: RadminTableConfig
  ) {
    this.log("setupViewConfigMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → attaching headerMouseEnter");
      table.on(
        "headerMouseEnter" as any,
        (e: MouseEvent, column: ColumnComponent) => {
          this.log("headerMouseEnter triggered", column);
          this.tabulatorToolbars.showColumnToolbar(column, e, tableConfigData);
        }
      );
    });
  }

  private setupRowActionsHover(
    table: Tabulator,
    enableEdit: boolean,
    enableDelete: boolean
  ) {
    this.log("setupRowActionsHover called", { enableEdit, enableDelete });

    try {
      table.off?.("rowMouseEnter");
    } catch (error) {
      console.error(
        "Failed to unbind rowMouseEnter",
        ErrorHelper.toErrorString(error)
      );
    }

    table.on("rowMouseEnter", (e, row: RowComponent) => {
      this.log("rowMouseEnter triggered", row.getData());
      if (enableEdit && enableDelete) {
        this.tabulatorToolbars.showEditDeleteToolbar(table, row, e);
      } else if (enableEdit) {
        this.tabulatorToolbars.showEditOnlyToolbar(table, row, e);
      } else if (enableDelete) {
        this.tabulatorToolbars.showDeleteOnlyToolbar(table, row, e);
      }
    });

    table.on("rowMouseLeave", (e, row: RowComponent) => {
      this.log("rowMouseLeave triggered", row.getData());
    });
  }

  private setupRowAddMode(
    table: Tabulator,
    tableConfigData: RadminTableConfig
  ) {
    this.log("setupRowAddMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → showing add button");
      this.tabulatorToolbars.showAddButton(table, tableConfigData);
    });
    try {
      this.log("trying to show add button immediately");
      this.tabulatorToolbars.showAddButton(table, tableConfigData);
    } catch (error) {
      this.log(
        "immediate add button failed",
        ErrorHelper.toErrorString(error)
      );
    }
  }
}
