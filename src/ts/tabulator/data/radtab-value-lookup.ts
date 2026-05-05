import { JsonSchema } from "../../schema/json-schema-model";
import { ServiceBase } from '../../shared/service-base';
import { RadminSchemaHelper } from '../../schema/radmin-schema-helper';

export class RadTabValueLookup extends ServiceBase {

  constructor(private schema: JsonSchema, private cellData: Record<string, unknown>) {
    super({ name: "RadTabValueLookup", enableDebug: false });
  }

  resolveValue(path: string) {
    return this.getNestedValue(path);
  }

  /** Case-insensitive nested lookup for dotted paths. */
  private getNestedValue(key: string): any {
    if (!this.cellData || !key)
      return undefined;

    try {
      // start with the cell data, then drill down
      let cur: any = this.cellData;
      for (const part of key.split(".")) {
        if (cur == null) 
          return undefined;

        const lower = part.toLowerCase();
        const match = cur[part]
          ?? cur[Object.keys(cur).find(k => k.toLowerCase() === lower)!]
          ?? cur[part.charAt(0).toLowerCase() + part.slice(1)]
          ?? cur[lower];

        if (match === undefined)
          return undefined;
        cur = match;
      }

      return cur;
    } catch {
      return undefined;
    }
  }

  /** Replaces [Key] or [Parent.Child] placeholders. */
  public resolveTemplate(template: string): string {
    if (!template)
      return "";
    this.log("resolve template/data", { template, data: this.cellData });

    try {
      const result = template.replace(/\[([^\]]+)\]/g, (_m, rawKey: string) => {
        if (!rawKey)
          return "";

        const key =
          this.schema && !rawKey.includes(".")
            ? new RadminSchemaHelper(this.schema).findCasing(rawKey)
            : rawKey;

        let val = this.cellData?.[key];
        if (val === undefined)
          val = this.getNestedValue(key);
        if (val == null)
          return "";

        if (typeof val === "object") {
          try { val = JSON.stringify(val); }
          catch { val = String(val); }
        }

        return encodeURIComponent(String(val));
      });

      this.log("replaceParameters result", { template, result });
      return result;
    } catch (err) {
      this.log("replaceParameters error", err);
      return "";
    }
  }

}


