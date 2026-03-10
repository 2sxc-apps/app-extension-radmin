import HtmlStripper from '../helpers/html-stripper';
import { SchemaFormatter } from '../helpers/schema-formatter';
import { JsonSchema, SchemaProperty } from '../models/json-schema-model';
import { ServiceBase } from '../shared/service-base';
import { formatConfigs } from './tabulator-column-formats';

/**
 * Helper to determine best formatter and sorter for a given schema property and format, used when auto-adding columns based on schema.
 */
export class FormatAndSortHelper extends ServiceBase {

  constructor() {
    super({ name: "FormatAndSortHelper", enableDebug: true });
  }


  public getFormatAndSortOfPropertyUnspecified(schema: JsonSchema, key: string) {
    const property = schema.properties[key];
    const format = SchemaFormatter.mapSchemaTypeToFormat(property);
    return this.getFormatAndSort(format, key, property);
  }

  
  public getFormatAndSort(format: string, key: string, property: SchemaProperty, isLink = false) {
    const formatConfig = formatConfigs[format] || {};
    this.log("Auto-adding column for key:", key, { format, formatConfig });

    let formatter = property.type === "object" || property.type === "array"
      ? SchemaFormatter.objectTitleFormatter
      : formatConfig.formatter;

    // If schema explicitly indicates html/wysiwyg, and no explicit formatter was provided,
    // and the column is not a link,
    // set the safe plain-text formatter but do not override objectTitleFormatter).
    if (!isLink && !formatter && HtmlStripper.schemaPropertyIndicatesHtml(property)) {
      this.log("Auto-injecting plainTextFormatter for auto-added html field:", key);
      formatter = HtmlStripper.plainTextFormatter;
    }

    let sorter = property.type === "object" || property.type === "array"
      ? "object"
      : formatConfig.sorter;

    // When link is enabled we don't want the object formatter/sorter interfering
    // (link formatter will produce a string)
    if (isLink) {
      this.log(`Overriding sorter to 'string' for linked object/array field '${key}'`);
      sorter = "string";
    }

    return { ...formatConfig, formatter, sorter };
  }
}