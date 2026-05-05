import type { ColumnComponent, RowComponent, Tabulator } from 'tabulator-tables';
import { IColumnToolbarAdapter, IDomAdapter, IRowAdapter } from '../../toolbars/toolbar-adapters';


/**
 * Adapter to make sure that generic toolbar operations can be performed on Tabulator columns without the toolbar needing to know about Tabulator specifics.
 */
export class TabulatorToolbarColumnAdapter implements IColumnToolbarAdapter {
  constructor(private column: ColumnComponent) {
    const colDef = column.getDefinition() || {};
    this.fieldName = (column.getField?.() ?? "") as string;
    this.title = (colDef.title ?? this.fieldName) || "";
  }

  fieldName: string;
  title: string;

  getElement() { return this.column.getElement(); }
}



export class TabulatorToolbarRowAdapter implements IRowAdapter {
  constructor(private row: RowComponent) { }

  getData() { return this.row.getData(); }

  getElement() { return this.row.getElement(); }
}

export class TabulatorToolbarTableAdapter implements IDomAdapter {
  constructor(private table: Tabulator) { }

  getElement() { return this.table.element; }
}