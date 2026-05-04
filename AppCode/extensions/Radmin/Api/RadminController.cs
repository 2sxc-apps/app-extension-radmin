using System;
using AppCode.Extensions.Radmin.Data;
using AppCode.Extensions.Radmin.Schemas;
using System.Threading.Tasks;
using System.Linq;
using ToSic.Eav.Data;


// Add namespaces to enable security in Oqtane & Dnn despite the differences
#if NETCOREAPP
  using Microsoft.AspNetCore.Authorization; // .net core [AllowAnonymous] & [Authorize]
  using Microsoft.AspNetCore.Mvc;           // .net core [HttpGet] / [HttpPost] etc.
#else
using System.Web.Http;
  using DotNetNuke.Security;
  using DotNetNuke.Web.Api;
  using IActionResult = System.Web.Http.IHttpActionResult;
#endif


namespace AppCode.Extensions.Radmin.Api
{
  // Requires edit rights to access - edit on the admin-pages
  [AllowAnonymous]	// define that all commands can be accessed without a login
  public class RadminController : Custom.Hybrid.ApiTyped
  {
    /// <summary>
    /// Get the schema for the given typename in JSON Schema format
    /// </summary>
    /// <param name="typename"></param>
    /// <returns></returns>
    [HttpGet]
    [DnnModuleAuthorize(AccessLevel = SecurityAccessLevel.Edit)]
    public async Task<IActionResult> Schema(Guid viewId)
    {
      // Get view definition, verify that it may be used
      var view = App.Data.GetOne<RadminTable>(viewId);
      var accessCheck = BlockBadAccess(view, viewId);
      if (accessCheck != null)
        return accessCheck;

      // Get content type - either from view definition, or from query definition (if view is based on a query)
      var contentType = GetContentType(view);

      var schema = new RadminSchemaHelper().ConvertToJsonSchema(contentType);
      return ResponseMessage(Ok(schema));
    }

    /// <summary>
    /// Get the content type based on the view definition. It can be defined directly, or indirectly via a query.
    /// </summary>
    /// <param name="view"></param>
    /// <returns></returns>
    private IContentType GetContentType(RadminTable view)
    {
      if (view.IsNotEmpty(nameof(view.DataContentType)))
        return App.Data.GetContentType(view.DataContentType);

      if (view.IsEmpty(nameof(view.DataQuery)))
        return null;

      var query = Kit.Data.GetQuery(view.DataQuery);

      if (view.IsEmpty(nameof(view.DataQueryStream)))
        return query.List.FirstOrDefault()?.Type;

      var stream = query.GetStream(view.DataQueryStream);
      if (stream == null)
        return null;

      return stream.List.FirstOrDefault()?.Type;
    }

    [HttpGet]
    public async Task<IActionResult> Table(Guid viewId)
    {
      /// <summary>
      /// Get the RadminTable for the given Guid
      /// </summary>
      var view = App.Data.GetOne<RadminTable>(viewId);

      return BlockBadAccess(view, viewId)
             ?? ResponseMessage(Ok(view));
    }

    private IActionResult BlockBadAccess(RadminTable view, Guid viewId)
    {
      if (MyUser.IsContentEditor)
        return null; // ok

      if (view == null)
        return BadRequest($"View with id {viewId} does not allow anonymous access");

      if (MyUser.IsAnonymous && view.ViewAllowAnonymous)
        return null; // ok

      // TODO: future also allow for role names etc.

      return ResponseMessage(Unauthorized());
    }
  }
}