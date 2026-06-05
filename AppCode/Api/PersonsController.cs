
using System.Web.Http;
using DotNetNuke.Web.Api;
using AppCode.Data;
using ToSic.Sxc.Services; // Make it easier to use https://go.2sxc.org/services
using System.Collections.Generic;
using System.Linq;

[AllowAnonymous]      // define that all commands can be accessed without a login
// Inherit from Custom.Hybrid.ApiTyped to get features like App, MyContext, Data etc.
// see https://docs.2sxc.org/web-api/custom/index.html
// Learn more on https://go.2sxc.org/cs-typed
public class PersonsController : Custom.Hybrid.ApiTyped
{
  [HttpGet] 
  public IEnumerable<Person> GetPerson(string nameId)
  {
    /// <summary>
    /// Get Person by nameId
    /// </summary>
    var favorites = App.Data.GetAll<Person>()
      .Where(p => p.IsNotEmpty(nameof(p.NameId)) && p.NameId.Equals(nameId))
      .ToList();

    return favorites;
  }
}