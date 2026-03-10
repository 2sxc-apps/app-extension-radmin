import { JsonSchema } from "../models/json-schema-model";

export class ParamMatcher {
  /** Case-insensitive nested lookup for dotted paths. */
  static getNestedValue(obj: any, key: string): any {
    if (!obj || !key) return undefined;

    try {
      let cur: any = obj;
      for (const part of key.split(".")) {
        if (cur == null) return undefined;

        const lower = part.toLowerCase();
        const match =
          cur[part] ??
          cur[Object.keys(cur).find(k => k.toLowerCase() === lower)!] ??
          cur[part.charAt(0).toLowerCase() + part.slice(1)] ??
          cur[lower];

        if (match === undefined) return undefined;
        cur = match;
      }

      return cur;
    } catch {
      return undefined;
    }
  }

  /** Replaces [Key] or [Parent.Child] placeholders. */
  static replaceParameters(
    template: string,
    data: any,
    schema?: JsonSchema,
    log?: (...args: any[]) => void
  ): string {
    if (!template) return "";
    log?.("replaceParameters template/data", { template, data });

    try {
      const result = template.replace(/\[([^\]]+)\]/g, (_m, rawKey: string) => {
        if (!rawKey) return "";

        const key =
          schema && !rawKey.includes(".")
            ? ParamMatcher.normalizeFieldName(rawKey, schema)
            : rawKey;

        let val = data?.[key];
        if (val === undefined) val = ParamMatcher.getNestedValue(data, key);
        if (val == null) return "";

        if (typeof val === "object") {
          try { val = JSON.stringify(val); } catch { val = String(val); }
        }

        return encodeURIComponent(String(val));
      });

      log?.("replaceParameters result", { template, result });
      return result;
    } catch (err) {
      log?.("replaceParameters error", err);
      return "";
    }
  }

  /** Normalize field names against schema property keys. */
  static normalizeFieldName(field: string, schema: JsonSchema): string {
    if (!field || !schema?.properties)
      return field;

    const keys = Object.keys(schema.properties);

    const exact = keys.find(k => k === field);
    if (exact)
      return exact;

    const ci = keys.find(k => k.toLowerCase() === field.toLowerCase());
    if (ci)
      return ci;

    const lcFirst = field.charAt(0).toLowerCase() + field.slice(1);
    const lc = keys.find(
      k => k === lcFirst || k.toLowerCase() === lcFirst.toLowerCase()
    );
    if (lc) return lc;

    return field;
  }
}
