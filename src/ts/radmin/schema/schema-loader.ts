import { Sxc } from "@2sic.com/2sxc-typings";
import { JsonSchema } from "./json-schema-model";

export class SchemaLoader {

  constructor(private sxc: Sxc) {}

  /**
   * Fetches the schema for a given content type
   * @param viewId The ID of the view
   * @returns A promise that resolves to the schema
   */
  async getSchema(viewId: string): Promise<JsonSchema> {
    try {
      return await this.sxc.webApi.fetchJson(
        `app/auto/api/radmin/schema?viewid=${viewId}`
      );
    } catch (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
  }
}
