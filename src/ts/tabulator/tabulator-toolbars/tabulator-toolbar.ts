import type {
  ColumnComponent,
  RowComponent,
  Tabulator,
} from "tabulator-tables";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import { createRowActionToolbar } from "../../toolbars/row-toolbar";
import { showColumnToolbar } from "../../toolbars/column-toolbar";
import { showAddButton } from "../../toolbars/table-add-button";
import { ServiceBase } from '../../shared/service-base';
import { ToolbarHoverHandler } from '../../toolbars/table-hover-handler';
import { Sxc } from '@2sic.com/2sxc-typings';
import { TabulatorToolbarColumnAdapter, TabulatorToolbarRowAdapter, TabulatorToolbarTableAdapter } from './tabulator-toolbar-adapters';

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
      table.element,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }

  createRowToolbar(
    sxc: Sxc,
    table: Tabulator,
    row: RowComponent,
    event: Event,
    tableConfigData: RadminTableConfig,
    hoverHandler: ToolbarHoverHandler

  ) {
    // call the function outside of this
    createRowActionToolbar(
      sxc,
      new TabulatorToolbarTableAdapter(table),
      new TabulatorToolbarRowAdapter(row),
      event,
      hoverHandler,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }

  public showColumnToolbar(
    sxc: any,
    column: ColumnComponent,
    event: Event,
    tableConfigData: RadminTableConfig,
    hoverHandler: ToolbarHoverHandler
  ) {
    showColumnToolbar(
      sxc,
      new TabulatorToolbarColumnAdapter(column),
      event,
      hoverHandler,
      tableConfigData,
      this.baseButtonSize,
      this.zIndex,
      (...a: any[]) => this.log(...a)
    );
  }
}
