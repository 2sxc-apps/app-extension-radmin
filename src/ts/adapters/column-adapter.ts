import { JsonSchema } from '../schema/json-schema-model';
import { ColumnSpecsWithConfig, ColumnSpecs } from '../schema/radmin-schema-helper';

/**
 * Adapter to convert RadminColumnConfig to a specific table systems ColumnDefinition.
 */
export interface ColumnAdapter<TColumn> {
  convertConfiguredColumn(schema: JsonSchema, spec: ColumnSpecsWithConfig): TColumn;

  convertUnconfiguredColumn(schema: JsonSchema, column: ColumnSpecs): TColumn;
}
