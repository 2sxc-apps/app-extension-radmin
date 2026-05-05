import { ColumnAdapter } from './adapters/column-adapter';
import { RadminColumnConfig } from '../configs/radmin-column-config';
import { JsonSchema } from './schema/json-schema-model';
import { RadminSchemaHelper, ColumnSpecs } from './schema/radmin-schema-helper';
import { ServiceBase } from '../shared/service-base';

/**
 * Service to convert RadminColumnConfig to a specific table systems ColumnDefinition, using the provided adapter and JSON schema for lookups.
 * Handles both configured columns and optionally auto-adding remaining columns from the schema.
 */
export class RadminColumnService<TColumn> extends ServiceBase {

  constructor({ schema, adapter, enableDebug }: { schema: JsonSchema; adapter: ColumnAdapter<TColumn>; enableDebug?: boolean; }) {
    super({ name: 'RadminColumnService', enableDebug });
    this.schema = schema;
    this.adapter = adapter;
  }

  public schema: JsonSchema;
  public adapter: ColumnAdapter<TColumn>;

  convert(
    columnConfigs: RadminColumnConfig[],
    columnsAutoShowRemaining: boolean
  ): TColumn[] {
    this.log("convert called with", {
      columnConfigLength: columnConfigs.length,
      columnsAutoShowRemaining,
      schemaProperties: Object.keys(this.schema.properties).length,
      columnConfigs
    });

    const all = new RadminSchemaHelper(this.schema).getConfigs(columnConfigs);

    const configuredColumns = all.configured
      .map((spec) => this.adapter.convertConfiguredColumn(this.schema, spec));

    this.log(`Configured columns built: ${configuredColumns.length}`);

    // Add remaining columns from schema if configured
    const addRemaining = columnsAutoShowRemaining || configuredColumns.length === 0;
    const rest = addRemaining
      ? this.convertRest(all.rest)
      : [];

    // Check any remaining fields that may have to be auto-added as well
    const result = [...configuredColumns, ...rest];
    return this.logAndReturn(result, `Total ${result.length}; addRemaining: ${addRemaining}; ${all.hidden.length} hidden`);
  }

  /**
   * Define remaining columns from the schema that are not already configured.
   * @param schemaHelper The helper for working with the JSON schema.
   * @param configuredFields The set of fields that have already been configured.
   * @returns An array of TabulatorColumnConfig for the remaining columns.
   */
  convertRest(restColumns: ColumnSpecs[]): TColumn[] {
    this.log("Defining remaining columns from schema. Total properties:", { restColumns });

    const result = restColumns
      .map((column) => this.adapter.convertUnconfiguredColumn(this.schema, column));

    return this.logAndReturn(result, "All auto-added columns built");
  }
}
