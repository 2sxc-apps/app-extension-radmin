import { TabulatorColumnConfig } from "../models/tabulator-config-models";
import { RadminColumnConfig } from "../configs/radmin-column-config";
import { CellComponent } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../models/json-schema-model";
import { GroupPropertyIdentifier } from "../helpers/group-property-identifier";
import { ValueLookup } from "../helpers/value-lookup.helper";
import { SchemaHelper } from '../helpers/schema-helper';
import { SchemaFormatter } from "../helpers/schema-formatter";
import { ServiceBase } from '../shared/service-base';
import { FormatAndSortHelper } from './format-and-sort.helper';

export class TabulatorColumnAdapter extends ServiceBase {

  constructor() {
    super({ name: "TabulatorColumnAdapter", enableDebug: true });
  }

  #formatAndSortHelper = new FormatAndSortHelper();

  convert(
    columnConfigs: RadminColumnConfig[],
    columnsAutoShowRemaining: boolean,
    schema: JsonSchema
  ): TabulatorColumnConfig[] {
    this.log("convert called with", {
      columnConfigLength: columnConfigs.length,
      columnsAutoShowRemaining,
      schemaProperties: Object.keys(schema.properties).length,
      columnConfigs
    });

    // Process configured columns (explicit user config). If a configured column points to a group property,
    // skip it (group fields should not become visible columns).
    const configuredColumns = columnConfigs
      .map((col) => {
        const fieldName = new SchemaHelper(schema).findCasing(col.valueSelector);
        const prop = schema.properties[fieldName];
        this.log(`configured column: '${col.valueSelector}' to '${fieldName}'`, { col }, `schemaProp:`, prop);

        if (GroupPropertyIdentifier.isGroup(prop, fieldName)) {
          // skip any configured column that references a group property
          this.log(`Skipping configured column because it references a group property: '${fieldName}'`, col);
          return null;
        }

        const chosenFormat = col.valueFormat
          || SchemaFormatter.getFormatFromSchema(col.valueSelector, schema);

        const formatAndSort = this.#formatAndSortHelper.getFormatAndSort(chosenFormat, fieldName, prop || { type: "string" } as SchemaProperty, !!col.linkEnable);

        const hAlign = col.horizontalAlignment !== "automatic"
          ? col.horizontalAlignment
          : undefined;

        const column: TabulatorColumnConfig = {
          title: col.title,
          field: fieldName,
          ...formatAndSort,
          // Only set alignment if explicitly specified
          hozAlign: hAlign,
          headerHozAlign: hAlign,
          // Only set width if explicitly specified
          width: col.width !== "automatic" ? col.width : undefined,
          // Handle tooltip configuration
          tooltip: !col.tooltipEnabled
            ? false
            : col.tooltipSelector
              ? (e, cell) => new ValueLookup(schema, cell.getData()).resolveTemplate(col.tooltipSelector)
              : true,
          ...this.linkFormatter(schema, col, fieldName)
        };

        this.log(`Final column config for field '${fieldName}'`, column);
        return column;
      })
      .filter((c): c is TabulatorColumnConfig => !!c); // remove nulls (skipped group columns)

    this.log(`Configured columns built: ${configuredColumns.length}`);

    // Add remaining columns from schema if configured
    if (!columnsAutoShowRemaining) {
      this.log("columnsAutoShowRemaining is false — returning configured columns only");
      return configuredColumns;
    }

    // Check any remaining fields that may have to be auto-added as well
    return this.tryAddRemainingColumns(schema, configuredColumns);
  }



  /**
   * Try to add remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredColumns The columns that have already been configured.
   * @returns An array of TabulatorColumnConfig including the newly added columns.
   */
  private tryAddRemainingColumns(schema: JsonSchema, configuredColumns: TabulatorColumnConfig[]) {
    // Get fields that are already configured
    const configuredFields = new Set(configuredColumns.map((col) => col.field));
    this.log("Configured fields set:", Array.from(configuredFields));

    // Create columns for remaining schema properties, skipping group properties
    const remainingColumns = this.defineRemainingColumns(schema, configuredFields);

    this.log(`Remaining columns built: ${remainingColumns.length}`);

    return [...configuredColumns, ...remainingColumns];
  }



  /**
   * Define remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredFields The set of fields that have already been configured.
   * @returns An array of TabulatorColumnConfig for the remaining columns.
   */
  private defineRemainingColumns(schema: JsonSchema, configuredFields: Set<string>) {
  
    const keysToUse = Object.keys(schema.properties)
      .filter((key) => !configuredFields.has(key))
      .filter((key) => {
        const prop = schema.properties[key];
        // do not auto-add group properties
        const isGroup = GroupPropertyIdentifier.isGroup(prop, key);
        if (isGroup)
          this.log("Skipping auto-add of group property:", key);
        return !isGroup;
      });

    return keysToUse
      .map((key) => {
        const property = schema.properties[key];
        const formatAndSort = this.#formatAndSortHelper.getFormatAndSortOfPropertyUnspecified(schema, key);

        const col: TabulatorColumnConfig = {
          title: property.title || key,
          field: key,
          ...formatAndSort
        } as TabulatorColumnConfig;

        this.log("Built auto column config for key:", key, col);
        return col;
      });
  }



  /**
   * Configure link if enabled
   */
  linkFormatter(schema: JsonSchema, col: RadminColumnConfig, normalizedField: string): Partial<TabulatorColumnConfig> {
    // if not enabled, just return empty config
    if (!col.linkEnable)
      return {};

    this.log(`Link enabled for column '${normalizedField}'`, {
      linkViewRef: col.linkViewRef,
      linkParameters: col.linkParameters,
    });

    return {
      formatter: "link",
      formatterParams: {
        url: (cell: CellComponent) => {
          const cellData = cell.getData();
          const valLookup = new ValueLookup(schema, cellData);
          const params = valLookup.resolveTemplate(col.linkParameters);

          const expectedParams = col.linkViewRef?.expectedParameters;
          this.log(`Expected parameters for link: '${expectedParams}'`, { col });
          const addParams = expectedParams
            ? valLookup.resolveTemplate(expectedParams)
            : '';


          // The view ID can be one of:
          // 1. Directly referencing another view via linkViewRef
          // 2. Directly referencing another value (view-key) via the viewId - such as 'tags-list'
          // 3. The viewId can also have a string such as '[viewId]' to reuse a value in the data
          const viewId = col.linkViewRef?.viewId
            || valLookup.resolveTemplate(col.linkViewId || "")
            || "unknown";

          const url = '?' + this.combineUrlParams({
            viewId: viewId,
            ...Object.fromEntries(new URLSearchParams(addParams)),
            ...Object.fromEntries(new URLSearchParams(params)),
          })

          this.log(`Generated link url for cell '${normalizedField}' to: '${url}'`);
          return url;
        },
        target: "_self",
        label: (cell: CellComponent) => SchemaFormatter.objectTitleFormatter(cell),
      }
    };
  }

  private combineUrlParams(params: Record<string, string>): string {
    const url = new URL("", window.location.origin);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.searchParams.toString();
  }
}

