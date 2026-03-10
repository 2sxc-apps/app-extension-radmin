import { RadminTableConfig } from "../configs/radmin-table-config";
import { JsonSchema } from "../models/json-schema-model";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { TabulatorConfig } from "../models/tabulator-config-models";
import { ColumnSortParser } from "../helpers/column-sort-parser";

/**
 * Service for creating a Tabulator configuration from RadminTableConfig.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  
  createTabulatorConfig(
    data: RadminTableConfig,
    schema: JsonSchema
  ): TabulatorConfig {
    const columnAdapter = new TabulatorColumnAdapter();

    const columns = columnAdapter.convert(
      data.columnConfigs,
      data.columnsAutoShowRemaining,
      schema
    );

    const columnParser = new ColumnSortParser();
    const parsedInitialSort = columnParser.parse(
      data.columnSort,
      columns,
      schema
    );

    // Tabulator treats the last entry in the initialSort array as the highest-priority
    // sort. The user expects left→right priority, so reverse here to present Tabulator
    // with the order it will apply (last = primary).
    const initialSortForTabulator =
      parsedInitialSort.length > 0
        ? [...parsedInitialSort].reverse()
        : undefined;

    return {
      layout: "fitDataFill",
      columns,
      title: data.title || "2sxc Table",
      viewId: data.viewId,
      id: data.id,
      columnConfigs: data.columnConfigs,
      searchEnabled: data.searchEnabled,
      initialSort: initialSortForTabulator,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: data.guid,
    } as TabulatorConfig;
  }
}
