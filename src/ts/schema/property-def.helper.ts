import { SchemaProperty } from "./json-schema-model";

export class PropertyDefHelper {
  static isGroup(property: SchemaProperty | undefined, key: string): boolean {
    if (!property)
      return false;

    // 1) explicit override in schema: property.radmin?.excludeFromTable = true
    //    (you can add this metadata to schema to force-hide a field)
    // @ts-ignore - allow optional custom metadata
    if (property.radmin?.excludeFromTable === true)
      return true;

    // 2) explicit semantic markers
    if (property.format === "group")
      return true;

    // 3) common naming patterns: key or title contains "group"
    if (key.toLowerCase().includes("group"))
      return true;
    if ((property.title || "").toLowerCase().includes("group"))
      return true;

    // 4) arrays/objects that look like grouped relations (best-effort)
    if (property.type === "array") {
      // If items are objects that have typical title fields, this is probably relation/group
      const items = (property as any).items;
      if (
        items &&
        items.properties &&
        (items.properties.Title || items.properties.title)
      ) {
        return true;
      }
    }

    // default: not considered a group
    return false;
  }
}
