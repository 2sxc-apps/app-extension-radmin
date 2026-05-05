/**
 * positioning + small DOM helpers for toolbars
 */

export function cleanupToolbars() {
  document.querySelectorAll(".toolbar-menu").forEach((el) => el.remove());
}

/**
 * Create a "virtual" element from coordinates that exposes getBoundingClientRect().
 * Used as reference for positioning.
 */
export function createVirtualElFromRects(x: number, y: number) {
  return {
    getBoundingClientRect() {
      return {
        width: 0,
        height: 0,
        x,
        y,
        top: y,
        left: x,
        right: x,
        bottom: y,
      } as DOMRect;
    },
  };
}

/**
 * Compute position and apply to element.
 *
 * - middlewareOffsetFn returns a horizontal offset (pixels).
 * - placement is kept for API compatibility but ignored here (we always place to the right).
 *
 * The function sets the toolbar element to position: fixed and places it so it is
 * vertically centered on the virtual y coordinate, and horizontally positioned at
 * virtual x + middlewareOffsetFn().
 *
 * Returns a Promise resolving to the applied { x, y } coordinates.
 */
export function positionToolbarElement(
  virtualEl: { getBoundingClientRect: () => DOMRect },
  toolbarEl: HTMLElement,
  middlewareOffsetFn: () => number = () => 0
): Promise<{ x: number; y: number }> {
  // Get reference rect from the virtual element
  const rect = virtualEl.getBoundingClientRect();
  const offsetValue = middlewareOffsetFn();

  // Ensure toolbar element is positioned relative to viewport so coords align
  toolbarEl.style.position = "fixed";

  // Compute left and vertically centered top
  // Use rect.left as the baseline (virtual x), add offsetValue (middleware)
  const left = rect.left + offsetValue;

  // Determine height of toolbar element (may be 0 until rendered; we try both)
  const toolbarHeight =
    toolbarEl.getBoundingClientRect().height || toolbarEl.offsetHeight || 0;

  // Center vertically on the virtual point (rect.top is the virtual y)
  const top = rect.top - toolbarHeight / 2;

  // Apply computed coords (rounded to avoid blurry sub-pixel positioning)
  const appliedLeft = Math.round(left);
  const appliedTop = Math.round(top);

  toolbarEl.style.left = `${appliedLeft}px`;
  toolbarEl.style.top = `${appliedTop}px`;

  return Promise.resolve({ x: appliedLeft, y: appliedTop });
}
