import type { ColumnComponent } from "tabulator-tables";
import { createVirtualElFromRects, positionToolbarElement, cleanupToolbars } from "./utils/toolbar-positioning";
import { RadminTableConfig } from "../../configs/radmin-table-config";
import { SxcGlobal } from '@2sic.com/2sxc-typings';

declare const $2sxc: SxcGlobal;

/**
 * Create and show a column header toolbar. This mirrors the row toolbar approach:
 * - simple hover flag on the toolbar
 * - table.on("headerMouseLeave", ...) removes toolbar after short delay if not hovered
 */
export function showColumnToolbar(
  column: ColumnComponent,
  event: Event,
  tableConfigData: RadminTableConfig,
  baseButtonSize: number,
  zIndex: number,
  log: (...args: any[]) => void
) {
  event.preventDefault();
  log("Creating column toolbar");

  cleanupToolbars();

  const table = column.getTable();
  const sxc = $2sxc(table.element);

  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping column toolbar");
    return;
  }

  const colEl = column.getElement();
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

  toolbarEl.innerHTML = getToolbar(sxc, column, tableConfigData);
  document.body.appendChild(toolbarEl);

  positionToolbarElement(virtualEl, toolbarEl, () => -baseButtonSize)
    .then(({ x, y }) => log("Computed column toolbar position", { x, y }));

  // simple hover removal (same pattern as rows)
  let isHovered = false;
  toolbarEl.addEventListener("mouseenter", () => {
    isHovered = true;
    log("Column toolbar hover start");
  });
  toolbarEl.addEventListener("mouseleave", () => {
    isHovered = false;
    log("Column toolbar hover end — removing");
    toolbarEl.remove();
  });

  // Remove toolbar when header is left (gives time to move into the toolbar)
  (table as any).on("headerMouseLeave", () => {
    setTimeout(() => {
      if (!isHovered) {
        log("Header mouse leave — removing column toolbar");
        toolbarEl.remove();
      }
    }, 100);
  });
}

function getToolbar(sxc: any, column: ColumnComponent, tableConfigData: RadminTableConfig): string {
  const configuredColumns = Array.isArray(tableConfigData.columnConfigs)
    ? tableConfigData.columnConfigs
    : [];
  const colDef = column.getDefinition() || {};
  const colField = (column.getField && column.getField()) ?? "";
  const colTitle = (colDef.title ?? colField) || "";

  const colConfig = configuredColumns.find((cfg: any) => {
    const cfgTitle = String(cfg.Title ?? cfg.title ?? "");
    return cfgTitle === colTitle || cfgTitle === colField;
  });

  const alreadyConfigured = !!colConfig;
  const entityId = colConfig ? (colConfig.id as number) : 0;

  let toolbarHtml: string;
  if (alreadyConfigured) {
    toolbarHtml = sxc.manage.getToolbar({
      entityId,
      action: "edit",
    });
  } else {
    const fieldValue = colField && colField.trim() !== ""
      ? colField
      : colTitle.replace(/\s+/g, "");



    toolbarHtml = sxc.manage.getToolbar({
      contentType: "f58eaa8e-88c0-403a-a996-9afc01ec14be",
      action: "new",
      prefill: {
        Title: colTitle,
        linkEnable: false,
        tooltipEnabled: false,
        FieldValue: fieldValue,
      },
      fields: "ColumnConfigs",
      parent: tableConfigData.guid,
    });
  }
  return toolbarHtml;
}

