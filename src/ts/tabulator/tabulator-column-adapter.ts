import { RadminColumnConfig } from "../configs/radmin-column-config";
import { CellComponent, ColumnDefinition } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../schema/json-schema-model";
import { PropertyDefHelper } from "../schema/property-def.helper";
import { RadTabValueLookup } from "./data/radtab-value-lookup";
import { SchemaHelper } from '../schema/schema-helper';
import { RadTabFormatAdapter } from "./data/radtab-format-adapter";
import { ServiceBase } from '../shared/service-base';
import { FormatAndSortHelper } from './format-and-sort.helper';

export class TabulatorColumnAdapter extends ServiceBase {

  constructor() {
    super({ name: "TabulatorColumnAdapter", enableDebug: true });
  }

  #formatAndSortHelper = new FormatAndSortHelper();
  #radTabFormatAdapter = new RadTabFormatAdapter();

  convert(
    columnConfigs: RadminColumnConfig[],
    columnsAutoShowRemaining: boolean,
    schema: JsonSchema
  ): ColumnDefinition[] {
    this.log("convert called with", {
      columnConfigLength: columnConfigs.length,
      columnsAutoShowRemaining,
      schemaProperties: Object.keys(schema.properties).length,
      columnConfigs
    });

    // Process configured columns (explicit user config). If a configured column points to a group property,
    // skip it (group fields should not become visible columns).
    const columns = columnConfigs
      .map((col) => {
        const fieldName = new SchemaHelper(schema).findCasing(col.fieldValue);
        const prop = schema.properties[fieldName];
        this.log(`configured column: '${col.fieldValue}' to '${fieldName}'`, { col }, `schemaProp:`, prop);

        // skip any configured column that references a group property
        if (PropertyDefHelper.isGroup(prop, fieldName)) 
          return this.logAndReturn(null, `Skipping configured column because it references a group property: '${fieldName}'`, col);
        return { fieldName, col, prop };
      })
      .filter((c) => !!c); // remove nulls (skipped group columns);

    const configuredColumns = columns
      .map(({ fieldName, col, prop }) => {
        const chosenFormat = col.fieldFormat
          || this.#radTabFormatAdapter.getFormatFromSchema(col.fieldValue, schema);

        const formatAndSort = this.#formatAndSortHelper.getFormatAndSort(chosenFormat, fieldName, prop || { type: "string" } as SchemaProperty, !!col.linkType);

        const hAlign = col.horizontalAlignment !== "automatic"
          ? col.horizontalAlignment
          : undefined;

        const column: ColumnDefinition = {
          title: col.title,
          field: fieldName,
          headerTooltip: col.headerTooltip || false,
          ...formatAndSort,
          // Only set alignment if explicitly specified
          hozAlign: hAlign,
          headerHozAlign: hAlign,
          // Only set width if explicitly specified
          width: col.width !== "automatic"
            ? col.width
            : undefined,
          // Handle tooltip configuration
          tooltip: (!col.fieldTooltip
            ? false
            : col.fieldTooltip
              ? (e: UIEvent, cell: CellComponent, _: unknown) => new RadTabValueLookup(schema, cell.getData()).resolveTemplate(col.fieldTooltip)
              : true) as unknown as string,
          ...this.linkFormatter(schema, col, fieldName)
        };
// console.log('2dmx');
        return this.logAndReturn(column, `Final column config for field '${fieldName}'`);
      });
      // .filter((c): c is ColumnDefinition => !!c); // remove nulls (skipped group columns)

    this.log(`Configured columns built: ${configuredColumns.length}`);

    // Add remaining columns from schema if configured
    if (!columnsAutoShowRemaining && configuredColumns.length > 0)
      return this.logAndReturn(configuredColumns, "columnsAutoShowRemaining is false — returning configured columns only");

    // Check any remaining fields that may have to be auto-added as well
    return this.#tryAddRemainingColumns(schema, configuredColumns);
  }



  /**
   * Try to add remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredColumns The columns that have already been configured.
   * @returns An array of TabulatorColumnConfig including the newly added columns.
   */
  #tryAddRemainingColumns(schema: JsonSchema, configuredColumns: ColumnDefinition[]) {
    // Get fields that are already configured
    const configuredFields = new Set(configuredColumns.filter(col => !!col)
      .map((col) => col.field as string));
    this.log("Configured fields set:", Array.from(configuredFields));

    // Create columns for remaining schema properties, skipping group properties
    const remainingColumns = this.#defineRemainingColumns(schema, configuredFields);

    this.log(`Remaining columns built: ${remainingColumns.length}`);

    return [...configuredColumns, ...remainingColumns];
  }



  /**
   * Define remaining columns from the schema that are not already configured.
   * @param schema The JSON schema defining the properties.
   * @param configuredFields The set of fields that have already been configured.
   * @returns An array of TabulatorColumnConfig for the remaining columns.
   */
  #defineRemainingColumns(schema: JsonSchema, configuredFields: Set<string>) {
    this.log("Defining remaining columns from schema. Total properties:", { schema, configuredFields });
    const keysToUse = Object.keys(schema.properties)
      .filter((key) => !configuredFields.has(key))
      .filter((key) => {
        const prop = schema.properties[key];
        // do not auto-add group properties
        const isGroup = PropertyDefHelper.isGroup(prop, key);
        if (isGroup)
          this.log("Skipping auto-add of group property:", key);
        return !isGroup;
      });

    return keysToUse
      .map((key) => {
        const property = schema.properties[key];
        const formatAndSort = this.#formatAndSortHelper.getFormatAndSortOfPropertyUnspecified(schema, key);

        const col: ColumnDefinition = {
          title: property.title || key,
          field: key,
          ...formatAndSort
        };

        return this.logAndReturn(col, "Built auto column config for key:", key);
      });
  }



  /**
   * Configure link if enabled
   */
  linkFormatter(schema: JsonSchema, col: RadminColumnConfig, normalizedField: string): Partial<ColumnDefinition> {
    // if not enabled (linkType blank), just return empty config
    if (!col.linkType)
      return {};

    this.log(`Link enabled for column '${normalizedField}'`, {
      linkViewRef: col.linkViewRef,
      linkParameters: col.linkParameters,
    });

    return {
      formatter: "link",
      formatterParams: {
        url: (cell: CellComponent) => {
          // Prepare lookup and parameters
          const valLookup = new RadTabValueLookup(schema, cell.getData());
          const params = valLookup.resolveTemplate(col.linkParameters);

          const expectedParams = col.linkViewRef?.expectedParameters;
          this.log(`Expected parameters for link: '${expectedParams}'`, { col });
          const addParams = expectedParams
            ? valLookup.resolveTemplate(expectedParams)
            : '';
          
          const allParams = {
            // Requested params goes first
            ...Object.fromEntries(new URLSearchParams(addParams)),
            // Added by current view configuration last, has precedence over any conflicting keys in the requested params
            ...Object.fromEntries(new URLSearchParams(params)),
          }

          if (col.linkType == 'url') {
            const urlParams = this.#combineUrlParams(allParams);
            this.log(`Generated URL for cell '${normalizedField}': '${urlParams}'`, { addParams, params });
            return `${col.linkUrl}${urlParams ? '?' + urlParams : ''}`;
          }

          // The view ID can be one of:
          // 1. Directly referencing another view via linkViewRef
          // 2. Directly referencing another value (view-key) via the viewId - such as 'tags-list'
          // 3. The viewId can also have a string such as '[viewId]' to reuse a value in the data
          const viewId = col.linkViewRef?.viewId
            || valLookup.resolveTemplate(col.linkViewId || "")
            || "unknown";

          const url = '?' + this.#combineUrlParams({
            viewId: viewId,
            ...allParams,
          })

          this.log(`Generated link url for cell '${normalizedField}' to: '${url}'`);
          return url;
        },
        target: col.linkTarget || "_self",
        label: (cell: CellComponent) => RadTabFormatAdapter.objectTitleFormatter(cell),
      }
    };
  }

  #combineUrlParams(params: Record<string, string>): string {
    const url = new URL("", window.location.origin);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    return url.searchParams.toString();
  }
}

