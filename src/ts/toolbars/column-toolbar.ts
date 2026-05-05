import { createVirtualElFromRects, positionToolbarElement, cleanupToolbars } from "./toolbar-positioning";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { ToolbarHoverHandler } from './table-hover-handler';
import { IColumnToolbarAdapter } from './toolbar-adapters';
import { Sxc } from '@2sic.com/2sxc-typings';

const ColumnContentTypeId = 'f58eaa8e-88c0-403a-a996-9afc01ec14be';

/**
 * Create and show a column header toolbar. This mirrors the row toolbar approach:
 * - simple hover flag on the toolbar
 * - table.on("headerMouseLeave", ...) removes toolbar after short delay if not hovered
 */
export function showColumnToolbar(
  sxc: Sxc,
  colInfo: IColumnToolbarAdapter,
  event: Event,
  hoverHandler: ToolbarHoverHandler,
  tableConfigData: RadminTableConfig,
  baseButtonSize: number,
  zIndex: number,
  log: (...args: any[]) => void
) {
  event.preventDefault();
  log("Creating column toolbar");

  cleanupToolbars();

  const colEl = colInfo.getElement();
  const colRect = colEl.getBoundingClientRect();
  log("Column rect", colRect);

  const virtualEl = createVirtualElFromRects(
    colRect.right,
    colRect.top + colRect.height / 2
  );

  const toolbarEl = document.createElement("div");
  toolbarEl.className = "toolbar-menu";
  Object.assign(toolbarEl.style, {
    position: "absolute",
    width: `${baseButtonSize}px`,
    height: `${baseButtonSize}px`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: String(zIndex),
    pointerEvents: "auto",
  });

  toolbarEl.innerHTML = getToolbar(sxc, colInfo, tableConfigData);
  document.body.appendChild(toolbarEl);

  positionToolbarElement(virtualEl, toolbarEl, () => -baseButtonSize)
    .then(({ x, y }) => log("Computed column toolbar position", { x, y }));

  hoverHandler.watch(toolbarEl, "column", log);
}


function getToolbar(sxc: Sxc, colInfo: IColumnToolbarAdapter, tableConfigData: RadminTableConfig): string {
  const configuredColumns = Array.isArray(tableConfigData.columnConfigs)
    ? tableConfigData.columnConfigs
    : [];

  const colConfig = configuredColumns.find((cfg: any) => {
    const cfgTitle = String(cfg.Title ?? cfg.title /* try lower case, not sure why both */ ?? "");
    return cfgTitle === colInfo.title || cfgTitle === colInfo.fieldName;
  });

  // If already configured, just return an edit + move up/down toolbar
  const alreadyConfigured = !!colConfig;
  if (alreadyConfigured) {
    // find the index of the colConfig
    const colIndex = colConfig ? configuredColumns.indexOf(colConfig) : -1;
    const entityId = colConfig ? (colConfig.id as number) : 0;

    // Create the edit/move toolbar for the column
    return (sxc as any).manage.getToolbar({
      groups: [
        { buttons: "edit", },
        { buttons: "moveup,movedown", },
        // 2026-05-05 2dm, considered adding a remove/delete button to remove the configuration
        // but I believe it would only confuse, since people would think it deletes the column,
        // while it would only remove the configuration and make the column show with default settings again. So for now, this is left out to avoid confusion.
        // { buttons: "remove", params: {
        //     tooltip: "Delete column",
        //     title: "Delete column 2dmx",
        //     entityId,
        //     entityGuid: colConfig.guid,
        //     entityTitle: colConfig.title,
        //     // contentType: ColumnContentTypeId,
        //     // parent: tableConfigData.guid,
        //   }
        // },
        // 2026-05-04 2dm, experimental add-id-column with link
        // it works, but it's not clear where we should put this link, so commented out again for now.
        // { buttons: [{
        //   action: "new",
        //   params: {
        //     contentType: ColumnContentTypeId,
        //     parent: tableConfigData.guid,
        //     fields: "ColumnConfigs",
        //     index: -1,
        //     prefill: {
        //       Title: 'Id',
        //       FieldValue: 'id',
        //       LinkType: 'view',
        //       LinkViewRef: 'e935d112-f33d-468e-9144-eb9f271a59a9', // Reference to default details-view
        //     },
        //   }
        // }]
        // },
      ],
      params: {
        entityId,
        parent: tableConfigData.guid,
        fields: "ColumnConfigs",
        index: colIndex,
      }
    });
  }
  
  // Not yet configured, create an "add" toolbar with pre-filled values
  const fieldValue = colInfo.fieldName && colInfo.fieldName.trim() !== ""
    ? colInfo.fieldName
    : colInfo.title.replace(/\s+/g, "");

  return (sxc as any).manage.getToolbar({
    action: "new",
    params: {
      contentType: ColumnContentTypeId,
      parent: tableConfigData.guid,
      fields: "ColumnConfigs",
      index: configuredColumns.length,
      prefill: {
        Title: colInfo.title,
        FieldValue: fieldValue,
      },
    },
  });
}

