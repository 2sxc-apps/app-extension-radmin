import { RadminTableConfig } from "../configs/radmin-table-config";
import { JsonSchema } from "../radmin/schema/json-schema-model";
import { TabulatorColumnAdapter } from "./tabulator-column-adapter";
import { RadminColumnService } from '../radmin/radmin-column-service';
import { RadTabColumnSortParser } from "./sort/radtab-column-sort-parser";
import { Options } from 'tabulator-tables';
import { RadTabSetupSort } from './sort/radtab-setup-sort';
import { SearchSpecs, TableSpecs } from '../radmin/setup-params';

/**
 * Service for creating a Tabulator configuration from RadminTableConfig.
 * Is used to convert the configuration from 2sxc into a format that Tabulator can understand.
 */
export class TabulatorConfigService {
  
  createTabulatorConfig(
    specs: SearchSpecs & TableSpecs,
    data: RadminTableConfig,
    schema: JsonSchema
  ): Partial<Options> {

    // Convert column definitions
    const colAdapter = new TabulatorColumnAdapter();
    const columns = new RadminColumnService({ schema, adapter: colAdapter, enableDebug: true }).convert(
      data.columnConfigs,
      data.columnsAutoShowRemaining
    );

    // @2pp - not sure why you would do this? - it should take the config
    // Figure out initial sort
    // If it's cached in the sessionState, use that (eg. when sorting, editing, then reloading)
    // Otherwise use definition from data
    const initialSort = // new RadTabSetupSort().loadSortFromSession(specs.tableName)
      // ??
      new RadTabColumnSortParser().loadFromSettings(
          schema,
          columns,
          data.columnSort,
        );

    return {
      layout: "fitDataFill",
      columns,
      title: data.title || "2sxc Table",
      viewId: data.viewId,
      id: data.id,
      columnConfigs: data.columnConfigs,
      searchEnabled: data.searchEnabled,
      initialSort,
      columnsAutoShowRemaining: data.columnsAutoShowRemaining,
      pagination: data.pagingMode === "true",
      paginationSize: data.pagingSize ?? 10,
      guid: data.guid,
    } as Partial<Options>;
  }
}
