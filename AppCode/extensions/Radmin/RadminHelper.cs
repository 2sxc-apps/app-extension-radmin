using System;
using System.Linq;
using AppCode.Extensions.Radmin.Data;
using Custom.Hybrid;
using ToSic.Sxc.Edit.Toolbar;

namespace AppCode.Extensions.Radmin
{
  public class RadminHelper: CodeTyped
  {
    /// <summary>
    /// Get the resources
    /// </summary>
    public RadminResources GetResources()
    {
      if (_resources != null)
        return _resources;

      var resources = App.Data.GetStream(nameof(RadminResources)).ToList();
  
      switch (resources.Count) {
        case 0:
          throw new Exception("Radmin Resources definition is missing - please create one in the Radmin app.");
        case 1:
          // Only one resource - all good
          return _resources = As<RadminResources>(resources[0]);
        default:
          // Multiple resources found - use the first one but log a warning
          var resCustomized = resources.Last();
          return _resources = AsStack<RadminResources>(resCustomized, resources[0]);
      }
    }
    private RadminResources _resources;

    public bool IsConfigMode => _isConfigMode ??= MyPage.Parameters.Bool(RadminConstants.UrlParamConfigMode, fallback: false);
    private bool? _isConfigMode;

    /// <summary>
    /// Get the toolbar for the Radmin table, which 
    /// includes a "toggle configuration mode" button if data is configured and user is admin.
    /// </summary>
    /// <param name="tableSpecs">The specifications of the Radmin table.</param>
    /// <returns>The toolbar builder for the Radmin table.</returns>
    public IToolbarBuilder GetToolbar(RadminTable tableSpecs)
    {
      // If nothing is configured or this is a demo item,
      // just return the default toolbar (which will include a "Configure" button to start configuration)
      if (!tableSpecs.DataIsConfigured || tableSpecs.IsDemoItem)
        return Kit.Toolbar.Default(tableSpecs)
          .ReplaceEditButtonIcon();

      // a) Prepare materials to generate the toolbar
      var pageParams = MyPage.Parameters;
      var resources = GetResources();

      // b) Figure out if we're in config-mode, then prep the url for switching modes
      var onChangeLink = Link.To(parameters: pageParams.Toggle(RadminConstants.UrlParamConfigMode, "true"));

      // c) Add the "toggle configuration mode" button to the toolbar
      var mainToolbar = Kit.Toolbar.Default(tableSpecs)
        // if in config mode, always show the toolbar
        .Settings(show: IsConfigMode ? "always" : "hover")
        .ReplaceEditButtonIcon()
        // Prevent "New" button from appearing (would happen when the config is from the URL)
        .New("-")
        // Add an "Edit Columns" button which is only visible in config mode
        .Code("radmin.goToUrl", tweak: t => t
          .Icon(RadminConstants.IconEditColumns)    // sliders icon
          .Tooltip(IsConfigMode                     // label, different if we're in config mode or not
            ? resources.ViewConfigModeLabelActive
            : resources.ViewConfigModeLabel
          )
          .Color(IsConfigMode ? "#3372F9" : "")   // make it blue if active, default color if not
          .Parameters("url", onChangeLink)
        );
      return mainToolbar;
    }

  }

  internal static class RadminHelperExtensions
  {
    /// <summary>
    /// Replace the default edit button with a "Configure" button with a different icon
    /// </summary>
    /// <param name="toolbar"></param>
    /// <returns></returns>
    public static IToolbarBuilder ReplaceEditButtonIcon(this IToolbarBuilder toolbar) =>
      toolbar
        .Edit("-")
        .Edit(tweak: t => t.Icon(RadminConstants.IconConfigure));

  }
}