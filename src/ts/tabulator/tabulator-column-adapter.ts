import { RadminColumnConfig } from "../configs/radmin-column-config";
import { CellComponent, ColumnDefinition, GlobalTooltipOption } from "tabulator-tables";
import { JsonSchema, SchemaProperty } from "../radmin/schema/json-schema-model";
import { RadTabValueLookup } from "./data/radtab-value-lookup";
import { ColumnSpecs, ColumnSpecsWithConfig } from '../radmin/schema/radmin-schema-helper';
import { RadTabFormatAdapter } from "./data/radtab-format-adapter";
import { ServiceBase } from '../shared/service-base';
import { RadTabFormatAndSortHelper } from './format-and-sort.helper';
import { ColumnAdapter } from '../radmin/adapters/column-adapter';

/**
 * Tabulator specific adapter, used by the ColumnService.
 */
export class TabulatorColumnAdapter extends ServiceBase implements ColumnAdapter<ColumnDefinition> {

  constructor() {
    super({ name: "TabulatorColumnAdapter", enableDebug: true });
  }

  #formatAndSortHelper = new RadTabFormatAndSortHelper();
  #radTabFormatAdapter = new RadTabFormatAdapter();

  convertConfiguredColumn(schema: JsonSchema, spec: ColumnSpecsWithConfig): ColumnDefinition {
    const { fieldName, columnConfig, fieldSchema } = spec;
    const chosenFormat = columnConfig.fieldFormat
      || this.#radTabFormatAdapter.mapSchemaTypeToFormat(fieldSchema);

    const formatAndSort = this.#formatAndSortHelper.getFormatAndSort(chosenFormat, fieldName, fieldSchema || { type: "string" } as SchemaProperty, !!columnConfig.linkType);

    if (chosenFormat === "template") {
      formatAndSort.formatter = (cell: CellComponent) => {
        const data = cell.getData();
        const valueLookup = new RadTabValueLookup(schema, data);

        return decodeURIComponent(valueLookup.resolveTemplate(columnConfig.fieldTemplate || ""));
      };

      formatAndSort.sorter = "string";
    }

    if (chosenFormat === "date-template") {
      formatAndSort.formatter = (cell: CellComponent) => {
        const value = cell.getValue();

        if (!value)
          return "";

        return new RadTabValueLookup(schema, cell.getData())
          .resolveDateTemplate(value, columnConfig.fieldTemplate || "");
      };

      formatAndSort.sorter = "datetime";
    }

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
        ? (e: UIEvent, cell: CellComponent, _: unknown) => new RadTabValueLookup(schema, cell.getData()).resolveTemplate(columnConfig.fieldTooltip)
        : true;

    const column: ColumnDefinition = {
      title: columnConfig.title,
      field: fieldName,
      headerTooltip: columnConfig.headerTooltip || false,
      ...formatAndSort,
      hozAlign: hAlign,
      frozen: columnConfig.freezeColumn,
      headerHozAlign: hAlign,
      width,
      tooltip,
      ...this.#linkFormatter(schema, columnConfig, fieldName),
    };
    return this.logAndReturn(column, `Final column config for field '${fieldName}'`);
  }

  convertUnconfiguredColumn(schema: JsonSchema, column: ColumnSpecs): ColumnDefinition {
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

