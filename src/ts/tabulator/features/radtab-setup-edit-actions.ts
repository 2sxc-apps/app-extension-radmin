import { Tabulator, ColumnComponent, RowComponent } from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import { ErrorHelper } from "../../shared/error-helper";
import { TabulatorToolbars } from "../tabulator-toolbars/tabulator-toolbar";
import { ServiceBase } from '../../shared/service-base';
import { SearchSpecs, TableSpecs } from '../../radmin/setup-params';
import { TabulatorTableHoverHandler } from '../tabulator-toolbars/tabulator-table-hover-handler';


export class RadTabSetupEditActions extends ServiceBase {

  constructor() {
    super({ name: "RadTabSetupEditActions", enableDebug: false });
  }

  private tabulatorToolbars = new TabulatorToolbars();


  setupEditAddDelete(table: Tabulator, tableConfigData: RadminTableConfig, specs: SearchSpecs & TableSpecs) {
    if (this.#isViewConfigMode() && specs.canEditConfig) {
      this.log("in ViewConfigMode, setting up header handlers");
      this.#setupViewConfigMode(table, tableConfigData);
    }
    
    else if (specs.canEditData) {
      const editEnabled = !!tableConfigData.enableEdit;
      const canDelete = !!tableConfigData.enableDelete;
      this.log("row actions", { editEnabled, canDelete });
      if (editEnabled || canDelete)
        this.#setupRowActionsHover(table, tableConfigData);

      if (tableConfigData.enableAdd) {
        this.log("enabling row add mode");
        this.#setupRowAddMode(table, tableConfigData);
      }
    }
  }


  #isViewConfigMode(): boolean {
    const url = window.location.href.toLowerCase();
    const qp = new URLSearchParams(window.location.search)
      .get("viewconfigmode")
      ?.toLowerCase();
    return qp === "true" || url.includes("viewconfigmode/true");
  }

  #setupViewConfigMode(
    table: Tabulator,
    tableConfigData: RadminTableConfig
  ) {
    this.log("setupViewConfigMode called");
    table.on("dataLoaded", () => {
      this.log("dataLoaded → attaching headerMouseEnter");
      table.on("headerMouseEnter" as any,
        (e: MouseEvent, column: ColumnComponent) => {
          this.log("headerMouseEnter triggered", column);

          const table = column.getTable();
          const sxc = $2sxc(table.element);

          if (!sxc.isEditMode()) {
            this.log("Not in edit mode, skipping column toolbar");
            return;
          }

          const hoverHandler = new TabulatorTableHoverHandler(table);

          this.tabulatorToolbars.showColumnToolbar(sxc, column, e, tableConfigData, hoverHandler);
        }
      );
    });
  }

  #setupRowActionsHover(
    table: Tabulator,
    tableConfigData: RadminTableConfig
  ) {
    this.log("setupRowActionsHover called");

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

      const sxc = $2sxc(table.element);
      if (!sxc.isEditMode()) {
        this.log("Not in edit mode, skipping toolbar");
        return;
      }

      const hoverHandler = new TabulatorTableHoverHandler(table);

      this.tabulatorToolbars.createRowToolbar(sxc, table, row, e, tableConfigData, hoverHandler);
    });

    table.on("rowMouseLeave", (e, row: RowComponent) => {
      this.log("rowMouseLeave triggered", row.getData());
    });
  }

  #setupRowAddMode(
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