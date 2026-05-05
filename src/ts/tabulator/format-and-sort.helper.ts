import { ColumnDefinition } from 'tabulator-tables';
import HtmlStripper from '../shared/html-stripper';
import { RadTabFormatAdapter } from './data/radtab-format-adapter';
import { SchemaProperty } from '../radmin/schema/json-schema-model';
import { ServiceBase } from '../shared/service-base';
import { tabulatorFormatConfigs } from './tabulator-column-formats';
import { ColumnSpecs } from '../radmin/schema/radmin-schema-helper';

/**
 * Tabulator Helper to determine best formatter and sorter for a given schema property and format,
 * used when auto-adding columns based on schema.
 */
export class RadTabFormatAndSortHelper extends ServiceBase {

  constructor() {
    super({ name: "RadTabFormatAndSortHelper", enableDebug: true });
  }

  #formatAdapter = new RadTabFormatAdapter();

  public getFormatAndSortOfPropertyUnspecified({ fieldName, fieldSchema: propertyDefinition }: ColumnSpecs): Partial<ColumnDefinition> {
    const format = this.#formatAdapter.mapSchemaTypeToFormat(propertyDefinition);
    return this.getFormatAndSort(format, fieldName, propertyDefinition);
  }

  
  public getFormatAndSort(format: string, key: string, colDefinition: SchemaProperty, isLink = false): Partial<ColumnDefinition> {
    // Try to find a predefined format/formatter/sorter based on the format or schema type.
    // This covers common cases like dates and numbers
    const formatConfig = tabulatorFormatConfigs[format] || {};
    this.log("Auto-adding column for key:", key, { format, formatConfig });

    const propIsObjOrArray = colDefinition.type === "object" || colDefinition.type === "array";
    let formatter: ColumnDefinition['formatter'] = propIsObjOrArray
      ? RadTabFormatAdapter.objectTitleFormatter
      : formatConfig.formatter;

    // If schema explicitly indicates html/wysiwyg, and no explicit formatter was provided,
    // and the column is not a link,
    // set the safe plain-text formatter but do not override objectTitleFormatter).
    if (!isLink && !formatter && HtmlStripper.schemaPropertyIndicatesHtml(colDefinition)) {
      this.log("Auto-injecting plainTextFormatter for auto-added html field:", key);
      formatter = HtmlStripper.plainTextFormatter;
    }

    let sorter: ColumnDefinition['sorter'] = propIsObjOrArray
      ? "object" as unknown as ColumnDefinition["sorter"] // force type to satisfy ColumnDefinition but will be handled by custom sorter function
      : formatConfig.sorter || undefined;

    // When link is enabled we don't want the object formatter/sorter interfering
    // (link formatter will produce a string)
    if (isLink) {
      this.log(`Overriding sorter to 'string' for linked object/array field '${key}'`);
      sorter = "string";
    }

    const result: Partial<ColumnDefinition> = {
      ...formatConfig,
      formatter,
      sorter
    };
    return this.logAndReturn(result, `getFormatAndSort result for key: ${key}`, { format, colDefinition, isLink });
  }

}