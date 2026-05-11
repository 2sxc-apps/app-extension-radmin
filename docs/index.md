# Docs of Radmin

This should describe how Radmin works internally, to help contributors and AI understand the code and make changes to it.

The documentation to use Radmin is on <https://go.2sxc.org/radmin>.

## General Setup

Radmin is a 2sxc App Extension, which means it is installed into a 2sxc App and then can be used in that app.

Configuration is done via the "Edit" interface of the app, which allows you to set up the data source, columns, and other options.

## Runtime

At runtime, Radmin will render a table based on the configuration and data source.
It uses the Tabulator library to create a powerful and flexible table interface.

Internally this is the process:

### 1. Entry Razor

1. First, the view `Radmin Main.cshtml` is loaded.
1. Internally it will check if there is a configuration matching the viewId - either from the module configuration or the url parameter `viewid`.
1. It will check both list-configurations as well as details-view configurations, and will render the appropriate one (or show an error).

### 2. Table Initialization

#### 2.1 Razor Side

If it is a list, then it will render the `/List/Table.cshtml` view.

1. This will do some more checks - inkl. "is Demo" and show messages/warnings if needed.
1. It will then add placeholders to the page (for tabulator)
1. It will then load the JS and CSS files.
1. Then it uses turnOn to start the JS on `window.radmin.setup()` passing in the `viewid` and other specs to make it work.

#### 2.2 JS Side Entry

1. turnOn will wait for the objects to be ready, then trigger the `setup` function.
1. The main object and `setup()` function are mounted in the `/src/index.ts` - it's the `RadminMain` class from the `/radmin/radmin-main.ts`
1. This will then process the configuration
    1. Trigger loading of optional customizers
    1. load the configuration for the view from the backend API
    1. run the configuration through the customizers (if any)
1. then it will prepare the url parameters (without the view-id) for later use
1. and then trigger the tabulator setup

#### 2.3 Tabulator Setup

The tabulator setup will do things such as

1. Load the schema
1. Load the data
1. Render the table
1. Set up the event handlers for the table (e.g. row click, sorting, etc.)
1. Set up the buttons and other UI elements such as edit, delete, etc. based on the configuration
