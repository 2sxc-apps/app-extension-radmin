import { JsonSchema, SchemaProperty } from "../../schema/json-schema-model";
import { CellComponent } from "tabulator-tables";
import { SchemaHelper } from '../../schema/schema-helper';
import { ServiceBase } from '../../shared/service-base';

export class RadTabFormatAdapter extends ServiceBase {

  constructor() {
    super({ name: "RadTabFormatAdapter", enableDebug: true });
  }

  /** Maps JSON schema type/format → internal format key */
  mapSchemaTypeToFormat(property: SchemaProperty): string {
    if (!property)
      return "";

    if (property.format === "date-time" || property.format === "date")
      return this.logAndReturn(property.format, "mapSchemaTypeToFormat", { property });

    if (property.format === "uri" || property.format === "email")
      return this.logAndReturn("link", "mapSchemaTypeToFormat", { property });

    return this.logAndReturn(property.type, "mapSchemaTypeToFormat: falling back to type", { property });
  }

  /**
   * Normalizes the field and maps to format via schema
   */
  getFormatFromSchema(field: string, schema: JsonSchema): string {
    const normalized = new SchemaHelper(schema).findCasing(field);
    const property = schema.properties[normalized];

    const format = property
      ? this.mapSchemaTypeToFormat(property)
      : "";

    return this.logAndReturn(format, "getFormatFromSchema", { field, normalized, format });
  }

  /** Title formatter for object and array fields */
  static objectTitleFormatter(cell: CellComponent): string {
    const value = cell.getValue();

    if (!value)
      return "";

    if (Array.isArray(value)) {
      if (value.length === 0)
        return "";
      const first = value[0];
      const title = first?.Title ?? first?.title ?? JSON.stringify(first);
      const extra = value.length > 1 ? ` +${value.length - 1}` : "";
      return `${title}${extra}`;
    }

    if (typeof value === "object")
      return value.Title ?? value.title ?? JSON.stringify(value);

    return String(value);
  }
}
