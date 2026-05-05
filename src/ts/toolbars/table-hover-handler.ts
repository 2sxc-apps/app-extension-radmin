import { HoverState } from './hover-state';


export abstract class ToolbarHoverHandler {

  /**
   * Add a special hover-watcher to the toolbar element, which sets a flag on hover and removes the toolbar on mouseleave if not hovered.
   * @param toolbarEl 
   * @param log 
   * @returns 
   */
  watch(toolbarEl: HTMLElement, name: string, log: (...args: any[]) => void) {
    // console.log('2dm, hover handler');
    // simple hover removal (same pattern as rows)
    const hoverState: HoverState = { isHovered: false };
    // let isHovered = false;
    toolbarEl.addEventListener("mouseenter", () => {
      hoverState.isHovered = true;
      log(`${name} toolbar hover start`);
    });

    toolbarEl.addEventListener("mouseleave", () => {
      hoverState.isHovered = false;
      log(`${name} toolbar hover end — removing`);
      toolbarEl.remove();
    });

    this.watchTable(toolbarEl, hoverState, log);
  }

  abstract watchTable(toolbarEl: HTMLElement, hoverState: HoverState, log: (...args: any[]) => void): void;
}
