using System.Collections.Generic;
using System.Linq;
using ToSic.Eav.Data;
using System.Web;

namespace AppCode.Extensions.Radmin.Schemas
{
  public class RadminSchemaHelper
  {
    public JsonSchema ConvertToJsonSchema(IContentType contentType)
    {
      var portalSettings = HttpContext.Current.Items["PortalSettings"];
      var portalCulture = portalSettings?
        .GetType()
        .GetProperty("CultureCode")
        .GetValue(portalSettings, null)?
        .ToString()
        .ToLower();

      var propsList = contentType.Attributes
        .OrderBy(attribute => attribute.SortOrder)
        .Select(attribute =>
        {
          string schemaType = GetTypeName(attribute);
          string format = GetFormatName(attribute);

          // localized title, fall back to attribute.Name when missing
          string title = attribute.Metadata
            .OfType("@All")
            .FirstOrDefault()?
            .Get<string>("Name", language: portalCulture) ?? attribute.Name;

          // localized description (if present)
          string description = attribute.Metadata
            .OfType("@All")
            .FirstOrDefault()?
            .Get<string>("Description", language: portalCulture);

          // read input type - e.g. "html", "text", "textarea", "wysiwyg"
          string inputType = attribute.Metadata
            .OfType("@All")
            .FirstOrDefault()?
            .Get<string>("InputType");

          // Create schema property based on determined type, format, description and inputType
          return new JsonSchemaProperty(attribute.Name, title, schemaType, format, description, inputType);
        })
        .ToList();

      // var idProperty = new JsonSchemaProperty("Id", "Id", "number", null, "ID of the item")
      // {
      //   AutoLinkDetails = true
      // };
      // propsList.Insert(0, idProperty); // Ensure Id is the first property

      var properties = propsList.ToDictionary(p => p.Name, p => p); // Remove duplicates while preserving order

      var schema = new JsonSchema
      {
        Id = contentType.NameId.ToString(),
        Title = contentType.Name,
        Type = "object",
        Description = contentType.Metadata.Get<string>("Description"),
        Properties = properties,
        Required = contentType.Attributes
          .Where(a => a.IsTitle || a.Metadata.Get<bool>("Required"))
          .Select(a => a.Name)
          .ToList()
      };

      return schema;
    }

    // Updated method signature to match IContentTypeAttribute
    private string GetTypeName(IContentTypeAttribute attribute)
    {
      // Use the TypeMappings dictionary to get the type name
      return TypeMappings.TryGetValue(attribute.Type.ToString(), out var typeName)
        ? typeName
        : "string"; // Default to string if type not found
    }

    // Updated method signature to match IContentTypeAttribute
    private string GetFormatName(IContentTypeAttribute attribute)
    {
      // Use the FormatMappings dictionary to get the format
      return FormatMappings.TryGetValue(attribute.Type.ToString(), out var formatName)
        ? formatName
        : null; // No format if type not found in mappings
    }

    // Dictionary for type mappings
    private static Dictionary<string, string> TypeMappings = new Dictionary<string, string>
    {
      { "String", "string" },
      { "Number", "number" },
      { "Int", "number" },
      { "number", "number" },
      { "Decimal", "number" },
      { "Float", "number" },
      { "Double", "number" },
      { "Boolean", "boolean" },
      { "Entity", "object" },
      { "Object", "object" },
      { "Array", "array" },
      { "List", "array" }
    };

    // Dictionary for format mappings
    private static Dictionary<string, string> FormatMappings = new Dictionary<string, string>
    {
      { "DateTime", "date-time" },
      { "Date", "date" },
      { "Hyperlink", "uri" },
      { "Url", "uri" },
      { "Email", "email" }
    };
  }
}