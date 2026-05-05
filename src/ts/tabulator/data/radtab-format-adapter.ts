import { JsonSchema, SchemaProperty } from "../../radmin/schema/json-schema-model";
import { CellComponent } from "tabulator-tables";
import { RadminSchemaHelper } from '../../radmin/schema/radmin-schema-helper';
import { ServiceBase } from '../../shared/service-base';
import { tabulatorFormatConfigs } from '../tabulator-column-formats';

export class RadTabFormatAdapter extends ServiceBase {

  constructor() {
    super({ name: "RadTabFormatAdapter", enableDebug: true });
  }

  /**
   * Maps JSON schema type/format → internal format key
   * The resulting internal format-key will be used to lookup the actual Tabulator formatter/sorter in tabulator-column-formats based on the format or type of the field.
   */
  mapSchemaTypeToFormat(fieldSchema: SchemaProperty): keyof typeof tabulatorFormatConfigs | '' {
    if (!fieldSchema)
      return '';

    if (fieldSchema.format === "date-time" || fieldSchema.format === "date")
      return this.logAndReturn(fieldSchema.format, "mapSchemaTypeToFormat", { fieldSchema });

    if (fieldSchema.format === "uri" || fieldSchema.format === "email")
      return this.logAndReturn("link", "mapSchemaTypeToFormat", { fieldSchema });

    return this.logAndReturn(fieldSchema.type || '', "mapSchemaTypeToFormat: falling back to type", { fieldSchema });
  }

  /**
   * Normalizes the field and maps to format via schema
   */
  getFormatFromSchema(field: string, schema: JsonSchema): string {
    const normalized = new RadminSchemaHelper(schema).findCasing(field);
    const fieldSchema = schema.properties[normalized];

    const format = fieldSchema
      ? this.mapSchemaTypeToFormat(fieldSchema)
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
