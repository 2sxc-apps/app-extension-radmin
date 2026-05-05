import type { RowComponent, Tabulator } from "tabulator-tables";
import {
  cleanupToolbars,
  createVirtualElFromRects,
  positionToolbarElement,
} from "./utils/toolbar-positioning";
import { CommandNames } from "@2sic.com/2sxc-typings";
import { RadminTableConfig } from '../../configs/radmin-table-config';

declare const $2sxc: any;

/**
 * Create row action toolbar (extracted from the class to keep single-responsibility)
 */
export function createRowActionToolbar(
  table: Tabulator,
  row: RowComponent,
  event: Event,
  tableConfigData: RadminTableConfig,
  baseButtonSize: number,
  zIndex: number,
  log: (...args: any[]) => void
) {
  event.preventDefault();
  cleanupToolbars();
  const showEdit = !!tableConfigData.enableEdit;
  const showDelete = !!tableConfigData.enableDelete;

  log("Creating row action toolbar", { showEdit, showDelete });

  const sxc = $2sxc(table.element);
  if (!sxc.isEditMode()) {
    log("Not in edit mode, skipping toolbar");
    return;
  }

  const data = row.getData() as any;
  const entityId = data.EntityId ?? data.id;
  const entityGuid = data.EntityGuid ?? data.guid;
  const entityTitle = data.title ?? "";

  log("Entity identifiers for toolbar", { entityId, entityGuid, entityTitle });

  if (!entityId) {
    log("No entityId found for toolbar");
    return;
  }

  const tableRect = table.element.getBoundingClientRect();
  const rowRect = row.getElement().getBoundingClientRect();

  const virtualEl = createVirtualElFromRects(
    tableRect.right,
    rowRect.top + rowRect.height / 2
  );

  const toolbarEl = document.createElement("div");
  toolbarEl.className = "toolbar-menu";
  Object.assign(toolbarEl.style, {
    position: "absolute",
    background: "transparent",
    border: "none",
    boxShadow: "none",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    zIndex: String(zIndex),
    pointerEvents: "auto",
  });

  const actions: CommandNames[] = [];
  if (showEdit) {
    actions.push({
      entityId,
      action: "edit",
      ...(entityGuid && { entityGuid }),
    });
  }

  const canRequestDelete = !!entityId && !!entityGuid && !!entityTitle;
  if (showDelete) {
    if (canRequestDelete) {
      actions.push({
        entityId,
        action: "delete",
        ...(entityGuid && { entityGuid }),
        entityTitle,
      });
    } else {
      log(
        "Skipping server delete toolbar request because entityTitle/entityGuid missing or empty. Will not request native delete button.",
        { entityTitle, entityGuid }
      );
    }
  }

  if (actions.length === 0) {
    log("No actions to show in row action menu");
    return;
  }

  const toolbarHtml = sxc.manage.getToolbar(actions);
  log("Generated toolbar HTML:", toolbarHtml);

  toolbarEl.innerHTML = toolbarHtml;

  if (showDelete) {
    const hasDelete =
      toolbarEl.querySelector &&
      !!toolbarEl.querySelector('a[onclick*="delete"]');
    log("Server returned delete button present:", hasDelete);
  }

  document.body.appendChild(toolbarEl);
  log("Row action toolbar appended");

  const middlewareOffsetFn = () =>
    -(
      (showDelete ? baseButtonSize : 0) +
      (showEdit ? baseButtonSize : 0) +
      (showDelete && showEdit ? 16 : 12)
    );

  positionToolbarElement(virtualEl, toolbarEl, middlewareOffsetFn).then(
    ({ x, y }) => log("Computed toolbar position", { x, y })
  );

  let isHovered = false;
  toolbarEl.addEventListener("mouseenter", () => {
    isHovered = true;
    log("Toolbar hover start");
  });
  toolbarEl.addEventListener("mouseleave", () => {
    isHovered = false;
    log("Toolbar hover end — removing");
    toolbarEl.remove();
  });

  // mirror original behavior: remove on rowMouseLeave unless toolbar hovered
  table.on("rowMouseLeave", () => {
    setTimeout(() => {
      if (!isHovered) {
        log("Row mouse leave — removing toolbar");
        toolbarEl.remove();
      }
    }, 100);
  });
}
