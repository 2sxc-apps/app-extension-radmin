export interface JsonSchema {
  $schema: "https://json-schema.org/draft/2020-12/schema";
  $id: string;
  title: string;
  description: string;
  type: string;
  properties: Record<string, SchemaProperty>;
  required: string[];
}

export interface SchemaProperty {
  title: string;
  type: string;
  format?: string;
  inputType?: string;
  items?: Record<string, unknown>;
  description?: string;
}