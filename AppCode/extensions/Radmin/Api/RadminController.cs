// Add namespaces to enable security in Oqtane & Dnn despite the differences
#if NETCOREAPP
  using Microsoft.AspNetCore.Authorization; // .net core [AllowAnonymous] & [Authorize]
  using Microsoft.AspNetCore.Mvc;           // .net core [HttpGet] / [HttpPost] etc.
#else
  using System.Web.Http;
  using DotNetNuke.Security;
  using DotNetNuke.Web.Api;
#endif
using System;
using AppCode.Extensions.Radmin.Data;
using AppCode.Extensions.Radmin.Schemas;
// Note: since this DLL is not included by default, you must have the compile.json set to include System.Net.Http
using HttpResponseMessage = System.Net.Http.HttpResponseMessage;

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
    public JsonSchemaMain Schema(string typename, Guid viewId)
    {
      var contentType = App.Data.GetContentType(typename);
      var view = App.Data.GetOne<RadminTable>(viewId);
      
      if (MyUser.IsAnonymous && view.ViewAllowAnonymous) {
        return null;
      }

      var helper = new RadminSchemaHelper();
      MyPage.Parameters.Remove("typename");
      return helper.ConvertToJsonSchema(contentType);
    }

    [HttpGet]
    public HttpResponseMessage Table(Guid viewId)
    {
      /// <summary>
      /// Get the RadminTable for the given Guid
      /// </summary>
      var view = App.Data.GetOne<RadminTable>(viewId);

      return BlockBadAccess(view)
        ?? Ok(view);
    }

    private HttpResponseMessage BlockBadAccess(RadminTable view)
    {
      if (MyUser.IsContentEditor)
        return null; // ok

      if (MyUser.IsAnonymous && view.ViewAllowAnonymous)
        return null; // ok

      // TODO: future also allow for role names etc.

      return Unauthorized();
    }
  }
}