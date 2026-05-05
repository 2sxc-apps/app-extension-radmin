import type {
  ColumnComponent,
  RowComponent,
  Tabulator,
} from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import { createRowActionToolbar } from "./row-toolbar";
import { showColumnToolbar } from "./column-toolbar";
import { showAddButton } from "./add-button";
import { ServiceBase } from '../../shared/service-base';

/**
 * Facade class kept for backward compatibility.
 * Methods delegate to smaller modules to keep code readable.
 */
export class TabulatorToolbars extends ServiceBase {
  private baseButtonSize = 32;
  private zIndex = 1000;

  constructor() {
    super({ name: "TabulatorToolbars", enableDebug: false });
  }


  public showAddButton(table: Tabulator, tableConfigData: RadminTableConfig) {
    showAddButton(
      table,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }

  createRowToolbar(
    table: Tabulator,
    row: RowComponent,
    event: Event,
    tableConfigData: RadminTableConfig
  ) {
    // call the function outside of this
    createRowActionToolbar(
      table,
      row,
      event,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }

  public showColumnToolbar(
    column: ColumnComponent,
    event: Event,
    tableConfigData: RadminTableConfig
  ) {
    showColumnToolbar(
      column,
      event,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }
}

export default TabulatorToolbars;
