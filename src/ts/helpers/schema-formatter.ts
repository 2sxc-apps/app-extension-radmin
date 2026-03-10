import { JsonSchema, SchemaProperty } from "../models/json-schema-model";
import { CellComponent } from "tabulator-tables";
import { SchemaHelper } from './schema-helper';

export class SchemaFormatter {
  /** Maps JSON schema type/format → internal format key */
  static mapSchemaTypeToFormat(
    property: SchemaProperty,
    log?: (...args: any[]) => void
  ): string {
    if (!property) return "";

    if (property.format === "date-time") {
      log?.("mapSchemaTypeToFormat: using 'date-time'", { property });
      return "date-time";
    }

    if (property.format === "date") {
      log?.("mapSchemaTypeToFormat: using 'date'", { property });
      return "date";
    }

    if (property.format === "uri" || property.format === "email") {
      log?.("mapSchemaTypeToFormat: using 'link'", { property });
      return "link";
    }

    log?.("mapSchemaTypeToFormat: falling back to type", property.type);
    return property.type;
  }

  /** Normalizes the field and maps to format via schema */
  static getFormatFromSchema(
    field: string,
    schema: JsonSchema,
    log?: (...args: any[]) => void
  ): string {
    const normalized = new SchemaHelper(schema).findCasing(field);
    const property = schema.properties[normalized];

    const format = property
      ? SchemaFormatter.mapSchemaTypeToFormat(property, log)
      : "";

    log?.("getFormatFromSchema", { field, normalized, format });
    return format;
  }

  /** Title formatter for object and array fields */
  static objectTitleFormatter(cell: CellComponent): string {
    const value = cell.getValue();

    if (!value) return "";

    if (Array.isArray(value)) {
      if (value.length === 0) return "";
      const first = value[0];
      const title = first?.Title ?? first?.title ?? JSON.stringify(first);
      const extra = value.length > 1 ? ` +${value.length - 1}` : "";
      return `${title}${extra}`;
    }

    if (typeof value === "object") {
      return value.Title ?? value.title ?? JSON.stringify(value);
    }

    return String(value);
  }
}
