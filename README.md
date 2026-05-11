<img src="app-icon.png" align="right" width="200px">

# 2sxc Extension Radmin App

> This is a JavaScript App for creating quick tables
> with [2sxc](https://2sxc.org)
> for [DNN ☢️](https://www.dnnsoftware.com/)
> and [Oqtane 💧](https://www.oqtane.org/)

This **2sxc Extension Radmin** app provides a powerful and flexible way to create, manage,
and display tabular data in 2sxc apps to administer data.

| Aspect              | Status | Comments or Version
| ------------------- | :----: | -------------------
| 2sxc                | ✅     | requires 2sxc v21.04.00+
| Dnn                 | ✅     | For v9.11.2+
| Oqtane              | ✅     | Requires v10.00+
| No jQuery           | ✅     | Built with modern JavaScript
| TypeScript          | ✅     | Full TypeScript support
| Source & License    | ✅     | included, ISC/MIT
| Bootstrap 4         | ✅     | compatible
| Bootstrap 5         | ✅     | optimized
| Work in Progress    | ⚠️     | API may change

This means that it

1. can be used to create simple and advanced tables in minutes
2. can be modified to fit any needs

## Get Started

This is a 2sxc App extension.
Normally you'll want to install THE EXTENSION in your app, and start using it.

## Contributing

If you want to make contributions, then you should install _this App_, make changes, and then submit a PR.

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Wish List

1. Get data from a Web-API (instead of a query); must consider how the data must be returned
1. Ability to export data to Excel/CSV (would be a feature of tabulator, but if enabled should load more plugins and show the buttons, maybe more options)
1. Ability to specify a custom Razor page to show details
1. Ability to use OData parameters to filter data
1. Boolean column: toggle inverse of value so user sees ✅ on false and ❌ on true (e.g. "active" column, where you want to toggle active/inactive)
   Note: it may be better to have a generic "mapping" feature for columns, where you can specify that a boolean column should show "✅" for true and "❌" for false, or even more complex mappings (e.g. for status codes)
1. Custom filters - e.g. date range filter, dropdown filter for specific values, etc.
1. Enabled/disable JS logging to console in configuration

## TODO (2DM)

1. Customizers - there are no samples, so it can't be verified ATM!

## History

### 2025-05-05

1. 2dm: add `delete` button to internal list management of the `Columns` list
1. 2dm: Simplify column configuration regarding links and tooltips, by removing the "enable" checkbox and just checking if a value is set for the link/tooltip template
1. 2dm: Remove Ephemeral field "HasData" workaround; export in 2sxc 21.08 fixes the underlying issue, so this is no longer needed
1. 2dm: Column config - enable "hide" to make a column go away
1. 2dm: JS - major SoC toolbar logic
1. 2dm: JS - major separation of services / tabulator from core logic; prepare for more features and better maintainability

### 2026-05-04

1. 2ro: first v01.00.00 release
1. 2dm: add support for "stream" in query
1. 2dm: prepare v01.00.01 release

### 2026-05-01

1. 2dm: Fix initial edit-icon to show the same gears
1. 2dm: minor js refactoring
1. 2dm: improve warnings when viewId is unknown or showing details with missing/invalid guid
1. 2dm: Details: Improve showing data of content-type entity
1. 2dm: Details: show "❓" for null boolean values, "✅" for true and "❌" for false
1. 2dm: Improve handling of details-view, with permissions etc.
1. 2dm: Split details view into checks vs. table view, and show better warnings if something is wrong
1. 2dm: show date - default / automatic format is date only
1. 2dm: disable "layout" button once configured
1. 2dm: on new config, always show the toolbar, not only on hover

### 2026-03-11 / 03-12

1. 2dm: reorg TS files to better match purpose/topic
1. 2ro: move to Vite
1. 2dm: improve vite code a bit for more clarity
1. 2ro: minify JS, added .min suffix to output files

### 2026-03-09 / 03-10

1. 2dm: Move to better `app.csproj` structure
1. 2dm: Add view-icon for the extension
1. 2dm: Rename `RadminConstants`
1. 2dm: Show instructions on add-module
1. 2dm: change `window.table` to `window.radmin`
1. 2dm: lots of js refactoring / SoC
1. 2dm: restore ability to link to both views and tables
1. 2dm: move schema-infos into own folder/namespace
1. 2dm: Improve controller to use `IActionResult`
1. 2dm: Improve schema endpoint to also return schema of query
1. 2dm: Improve js to get query (was not working, was missing `/`)
1. 2dm: fix `id` and `guid` casing
1. 2dm: add feature 'url' / page
1. 2dm: link - add target option `_blank`
1. 2dm: add `headerTooltip`

### 2026-01-12

1. 2dm: Start listing todos in readme
1. 2dm: Rename part-files in extension/radmin to use spaces
1. 2dm: Fix Detail View to show entity title and id in header
1. 2dm: fix closing `div` in Radmin Table cshtml to avoid page malfunction
1. 2dm: use `IsEmpty()` to check if a field is a title/group field
1. 2dm: Change query to pick view to also list tables; note that ATM tables don't seem to work as expected

### 2025-12-12

1. 2pp: Ensure Detail View Keys are sorted and rendered correctly
1. 2dm: Introduce stacked extensions
1. 2dm: Correct namespace of Radmin data
1. 2dm: Introduce js resources passed in by the razor

### 2025-12-11

1. 2pp: Add and configure Details View
1. 2pp: Use matcher to correctly retrieve infos for Details View

### 2025-12-10

1. 2pp: Fix Link formatted labels
1. 2pp: Update ViewId type to use RadminDetails type and not a string
1. 2pp: Update radmin schemas
1. 2pp: Refactor Column adapter into Helpers

### 2025-11-25

1. 2pp: Refactor Toolbars to use normal 2sxc Toolbars

### 2025-11-20

1. 2pp: Generate AppCode with Copilot
1. 2pp: Update Schema Endpoint to include viewId for ViewAllowAnonymous check
1. 2dm: select content type - now a dropdown
1. 2dm: select query - now a dropdown
1. 2dm: create group `Data` and add instructions for data; auto-collapse if already specified but show show title with data info
1. 2dm: hide paging info if disabled
1. 2dm: advanced columns "group" for JS settings, as very advanced / exotic
1. 2dm: group `Column features`: collapse + info in title if edit/delete/add are enabled

### v0.1.0 (Work in Progress)

* Initial architecture and core features
* TypeScript implementation
* Basic table functionality
