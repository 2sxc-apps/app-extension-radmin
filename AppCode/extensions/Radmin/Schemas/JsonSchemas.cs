using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AppCode.Extensions.Radmin.Schemas
{
  /// <summary>
  /// Main Schema / entry point for JSON Schema definition.
  /// </summary>
  public class JsonSchema
  {
    [JsonPropertyName("$schema")]
    public string Schema { get; set; } = "https://json-schema.org/draft/2020-12/schema";

    [JsonPropertyName("$id")]
    public string Id { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public Dictionary<string, JsonSchemaProperty> Properties { get; set; }
    public List<string> Required { get; set; }
  }

  /// <summary>
  /// Describes a single property in the JSON Schema, including its type, format, and other metadata.
  /// </summary>
  public class JsonSchemaProperty
  {
    public JsonSchemaProperty(string name, string title, string type, string format = null, string description = null, string inputType = null)
    {
      Name = name;
      Title = title;
      Type = type;
      Format = format;
      Description = description;
      InputType = inputType;
    }
    public string Name { get; set; }
    public string Title { get; set; }
    public string Type { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public string Format { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public Dictionary<string, object> Items { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public string Description { get; set; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public string InputType { get; set; }
  }
}
