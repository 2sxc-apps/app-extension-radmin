import { RadminColumnConfig } from "../configs/radmin-column-config";
import { CellComponent, ColumnDefinition, GlobalTooltipOption } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../schema/json-schema-model";
import { RadTabValueLookup } from "./data/radtab-value-lookup";
import { ColumnSpecs, ColumnSpecsWithConfig, RadminSchemaHelper } from '../schema/radmin-schema-helper';
import { RadTabFormatAdapter } from "./data/radtab-format-adapter";
import { ServiceBase } from '../shared/service-base';
import { RadTabFormatAndSortHelper } from './format-and-sort.helper';

abstract class RadminColumnAdapter<TColumn> extends ServiceBase {

  constructor({ schema, name, enableDebug }: { schema: JsonSchema; name: string; enableDebug?: boolean; }) {
    super({ name, enableDebug });
    this.schema = schema;
  }

  public schema: JsonSchema;

  abstract convertConfiguredColumn(spec: ColumnSpecsWithConfig): TColumn;

  abstract convertUnconfiguredColumn(column: ColumnSpecs): TColumn;


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
      .map((spec) => this.convertConfiguredColumn(spec));

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
      .map((column) => this.convertUnconfiguredColumn(column));

    return this.logAndReturn(result, "All auto-added columns built");
  }
}

export class TabulatorColumnAdapter extends RadminColumnAdapter<ColumnDefinition> {

  constructor(schema: JsonSchema) {
    super({ schema, name: "TabulatorColumnAdapter", enableDebug: true });
  }

  #formatAndSortHelper = new RadTabFormatAndSortHelper();
  #radTabFormatAdapter = new RadTabFormatAdapter();


  convertConfiguredColumn(spec: ColumnSpecsWithConfig): ColumnDefinition {
    const { fieldName, columnConfig, fieldSchema } = spec;
    const chosenFormat = columnConfig.fieldFormat
      || this.#radTabFormatAdapter.mapSchemaTypeToFormat(fieldSchema);

    const formatAndSort = this.#formatAndSortHelper.getFormatAndSort(chosenFormat, fieldName, fieldSchema || { type: "string" } as SchemaProperty, !!columnConfig.linkType);

    // Only set alignment if explicitly specified
    const hAlign = columnConfig.horizontalAlignment !== "automatic"
      ? columnConfig.horizontalAlignment
      : undefined;

    // Only set width if explicitly specified
    const width = columnConfig.width !== "automatic"
        ? columnConfig.width
        : undefined;

    // Handle tooltip configuration
    const tooltip: string | GlobalTooltipOption = !columnConfig.fieldTooltip
      ? false
      : columnConfig.fieldTooltip
        ? (e: UIEvent, cell: CellComponent, _: unknown) => new RadTabValueLookup(this.schema, cell.getData()).resolveTemplate(columnConfig.fieldTooltip)
        : true;

    const column: ColumnDefinition = {
      title: columnConfig.title,
      field: fieldName,
      headerTooltip: columnConfig.headerTooltip || false,
      ...formatAndSort,
      hozAlign: hAlign,
      headerHozAlign: hAlign,
      width,
      tooltip,
      ...this.#linkFormatter(this.schema, columnConfig, fieldName),
    };
    return this.logAndReturn(column, `Final column config for field '${fieldName}'`);
  }


  convertUnconfiguredColumn(column: ColumnSpecs): ColumnDefinition {
    const formatAndSort = this.#formatAndSortHelper.getFormatAndSortOfPropertyUnspecified(column);

    const result = {
      title: column.fieldSchema.title || column.fieldName,
      field: column.fieldName,
      ...formatAndSort,
    } satisfies ColumnDefinition;
    return result;
  }



  /**
   * Configure link if enabled
   */
  #linkFormatter(schema: JsonSchema, col: RadminColumnConfig, normalizedField: string): Partial<ColumnDefinition> {
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
    const searchParams = new URL("", window.location.origin).searchParams;
    Object.entries(params).forEach(([key, value]) => searchParams.append(key, value));
    return searchParams.toString();
  }
}

