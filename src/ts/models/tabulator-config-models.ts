import { CellComponent } from "tabulator-tables";
import { RadminTableConfig } from "../configs/radmin-table-config";

/** Minimal Sort entry shape used when configuring Tabulator programmatically */
export interface TabulatorSort {
  // Tabulator expects the property named 'column' when *passing* an array to initialSort/setSort
  column: string;
  dir: "asc" | "desc";
}

/** Tabulator Config
 * This is the format expected by the Tabulator library.
 */
export interface TabulatorConfig extends RadminTableConfig {
  layout:
    | "fitDataStretch"
    | "fitData"
    | "fitColumns"
    | "fitDataFill"
    | "fitDataTable"
    | undefined;
  data: object[];
  columns: { title: string; field: string }[];
  pagination: boolean;
  paginationSize: number;
  initialSort?: TabulatorSort[];
}

/** Tabulator Column Config
 * This is the format for the expected Tabulator Columns configuration options
 */
export interface TabulatorColumnConfig {
  title: string;
  field: string;
  headerTooltip?: string | boolean;
  tooltip?:
    | boolean
    | string
    | Node
    | ((e: Event, cell: CellComponent) => boolean | string | Node);
  headerHozAlign?: "right" | "left" | "center";
  hozAlign?: "right" | "left" | "center";
  width?: number | "automatic";
  formatter?: string | ((cell: CellComponent) => string);
  formatterParams?: object;
  sorter?:
    | string
    | ((
        a: unknown,
        b: unknown,
        aRow?: unknown,
        bRow?: unknown,
        column?: unknown,
        dir?: "asc" | "desc",
        sorterParams?: unknown
      ) => number);
}
