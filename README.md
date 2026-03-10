<img src="app-icon.png" align="right" width="200px">

# 2sxc Extension Radmin App

> This is a JavaScript App for creating dynamic tables with [2sxc](https://2sxc.org) for [DNN ☢️](https://www.dnnsoftware.com/) and [Oqtane 💧](https://www.oqtane.org/)

This **2sxc Extension Radmin** app provides a powerful and flexible way to create, manage, and display tabular data in 2sxc apps. Built with TypeScript, it offers robust typing and modern JavaScript features for enhanced development experience.

| Aspect              | Status | Comments or Version
| ------------------- | :----: | -------------------
| 2sxc                | ✅     | requires 2sxc v19.00.00+
| Dnn                 | ✅     | For v9.6.1+
| Oqtane              | ✅     | Requires v5.00+
| No jQuery           | ✅     | Built with modern JavaScript
| TypeScript          | ✅     | Full TypeScript support
| Source & License    | ✅     | included, ISC/MIT
| Bootstrap 4         | ✅     | compatible
| Bootstrap 5         | ✅     | optimized
| Work in Progress    | ⚠️     | API may change

This means that it

1. can be used to create a simple and advanced tables in minutes
2. can be modified to fit any needs

The app is built with the [pattern **Don't be DAFT**][daft] (DAFT = Densely Abstract Features for Techies), aka the **Anti-Abstraction** pattern.
So customizing it is mostly done using common technologies like HTML, JS and some C#.

## Get Started

This app is only useful if you use DNN or Oqtane. So assuming you have a DNN installation, all you need to do is install 2sxc and this app.

* Here's how to [install 2sxc and an App of your Choice](https://2sxc.org/en/apps/app/mobius-forms-v5-with-mailchimp-recaptcha-polymorph-weback-and-more-hybrid-for-dnn-and-oqtane)

* Now you can use this app as-is, or customize it to be whatever you need it to be.

* It probably helps to review the [Overview][overview] about how the parts play together by default, so you can then change as little as necessary to get it to do what you want

1. Add the necessary HTML:

```html
<div id="my-table"></div>
```

## Customize the App

The Source Code is all here - so you can easily customize to your hearts desire!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## TODO (2DM)

1. Customizers - there are no samples, so it can't be verified ATM!
1. fix tables linked by a column
1. show date - default / automatic format is date only
1. Big: Re-review handling of details, with permissions etc.

## History

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
