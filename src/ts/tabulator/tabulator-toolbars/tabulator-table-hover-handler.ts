import { EventCallBackMethods, Tabulator } from 'tabulator-tables';
import { ToolbarHoverHandler } from '../../toolbars/table-hover-handler';
import { HoverState } from '../../toolbars/hover-state';

export class TabulatorTableHoverHandler extends ToolbarHoverHandler {
  constructor(private table: Tabulator) {
    super();
  }

  watchTable(toolbarEl: HTMLElement, hoverState: HoverState, log: (...args: any[]) => void) {
    // Remove toolbar when header is left (gives time to move into the toolbar)
    this.table.on("headerMouseLeave" as keyof EventCallBackMethods, () => {
      setTimeout(() => {
        if (!hoverState.isHovered) {
          log("Header mouse leave — removing column toolbar");
          toolbarEl.remove();
        }
      }, 100);
    });
  }

}