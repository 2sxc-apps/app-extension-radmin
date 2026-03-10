import { Sxc } from "@2sic.com/2sxc-typings";
import { JsonSchema } from "../models/json-schema-model";

export class SchemaLoader {
  private sxc: Sxc;

  constructor(sxc: Sxc) {
    this.sxc = sxc;
  }

  /**
   * Fetches the schema for a given content type
   * @param viewId The ID of the view
   * @returns A promise that resolves to the schema
   */
  async getSchema(viewId: string): Promise<JsonSchema> {
    try {
      return await this.sxc.webApi.fetchJson(`app/auto/api/radmin/schema?viewid=${viewId}`);
    } catch (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
  }
}
