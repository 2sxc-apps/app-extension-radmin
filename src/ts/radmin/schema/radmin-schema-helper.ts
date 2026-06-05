import { JsonSchema, SchemaProperty } from './json-schema-model';
import { ServiceBase } from '../../shared/service-base';
import { RadminColumnConfig } from '../../configs/radmin-column-config';
import { PropertyDefHelper } from './property-def.helper';

/**
 * Helper for working with JSON schema in the context of Radmin tables, including field name normalization and lookups.
 * Used by multiple services including format/formatter determination and value lookups.
 */
export class RadminSchemaHelper extends ServiceBase {
  constructor(public schema: JsonSchema) {
    super({ name: "RadminSchemaHelper", enableDebug: false });
  }

  /**
   * Normalize field names against schema property keys.
   */
  findCasing(field: string): string {
    if (!field || !this.schema?.properties)
      return field;

    const keys = Object.keys(this.schema.properties);

    const exact = keys.find(k => k === field);
    if (exact)
      return exact;

    const fieldLc = field.toLowerCase();

    const ci = keys.find(k => k.toLowerCase() === fieldLc);
    if (ci)
      return ci;

    // TODO: not sure what this is for? will disable for now; seems to be an old camelCase comparison
    // const lcFirst = field.charAt(0).toLowerCase() + field.slice(1);
    // const lc = keys.find(
    //   k => k === lcFirst || k.toLowerCase() === lcFirst.toLowerCase()
    // );
    // if (lc)
    //   return lc;
    // handle "id" and "guid" as these are not in the list of provided fields
    if (fieldLc == 'id')
      return 'id';

    if (fieldLc == 'guid')
      return 'guid';

    return field;
  }

  getConfigs(columnConfigs: RadminColumnConfig[]): { configured: ColumnSpecsWithConfig[], rest: ColumnSpecs[], hidden: ColumnSpecsWithConfig[] } {
    const withConfig = this.#getRelevantConfigs(columnConfigs);
    
    // Group WithConfig by hidden / not hidden
    const hidden = withConfig.filter(c => c.columnConfig.hide);
    const nonHidden = withConfig.filter(c => !c.columnConfig.hide);
    this.log(`With config: total ${withConfig.length}; ${nonHidden.length} non-hidden, ${hidden.length} hidden`, { withConfig, hidden, nonHidden });
    
    const configuredFields = new Set(withConfig.map(c => c.fieldName));
    const rest = this.#getRemainingColumns(configuredFields);
    return { configured: nonHidden, rest, hidden };
  }


  #getRelevantConfigs(columnConfigs: RadminColumnConfig[]): ColumnSpecsWithConfig[] {
    // Process configured columns (explicit user config). If a configured column points to a group property,
    // skip it (group fields should not become visible columns).
    const columns = columnConfigs
      .map((colConfig) => {
        const fieldName = this.findCasing(colConfig.fieldValue);
        const colDefinition = this.schema.properties[fieldName];
        this.log(`configured column: '${colConfig.fieldValue}' to '${fieldName}'`, { colConfig, colDefinition });

        // skip any configured column that references a group property
        if (PropertyDefHelper.isGroup(colDefinition, fieldName)) 
          return this.logAndReturn(null, `Skipping configured column because it references a group property: '${fieldName}'`, colConfig);
        return { fieldName, columnConfig: colConfig, fieldSchema: colDefinition } satisfies ColumnSpecsWithConfig;
      })
      .filter((c) => !!c); // remove nulls (skipped group columns);

    return columns;
  }

  #getRemainingColumns(configuredFields: Set<string>): ColumnSpecs[] {
    this.log("Defining remaining columns from schema. Total properties:", { schema: this.schema, configuredFields });
    const keysToUse = Object.keys(this.schema.properties)
      .filter((key) => !configuredFields.has(key))
      .filter((key) => {
        const colDefinition = this.schema.properties[key];
        // do not auto-add group properties
        const isGroup = PropertyDefHelper.isGroup(colDefinition, key);
        if (isGroup)
          this.log("Skipping auto-add of group property:", key);
        return !isGroup;
      });

    const withDefinitions = keysToUse.map(key => {
      const fieldSchema = this.schema.properties[key];
      this.log(`Remaining column from schema: '${key}'`, { key, fieldSchema });
      return { fieldName: key, fieldSchema } satisfies ColumnSpecs;
    });
    return withDefinitions;
  }
}

export interface ColumnSpecs {
  fieldName: string;
  fieldSchema: SchemaProperty;
}

export interface ColumnSpecsWithConfig extends ColumnSpecs {
  columnConfig: RadminColumnConfig;
}