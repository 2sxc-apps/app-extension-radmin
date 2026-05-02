using System;
using AppCode.Extensions.Radmin.Data;
using AppCode.Extensions.Radmin.Schemas;
using System.Threading.Tasks;
using System.Linq;

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
      var contentType = view.IsNotEmpty(nameof(view.DataContentType)) 
        ? App.Data.GetContentType(view.DataContentType)
        : view.IsNotEmpty(nameof(view.DataQuery))
          ? Kit.Data.GetQuery(view.DataQuery).List.FirstOrDefault()?.Type
          : null;

      var schema = new RadminSchemaHelper().ConvertToJsonSchema(contentType);
      return ResponseMessage(Ok(schema));
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