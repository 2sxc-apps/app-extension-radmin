export interface TableAction {
  label: string;
  onClick: () => void;
}

export class RadTabSetupActions {
  setup(containerId?: string, actions: TableAction[] = []) {
    const container = containerId
      ? document.getElementById(containerId)
      : null;

    if (!container || actions.length === 0) return;

    container.classList.add("position-relative");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn-outline-secondary";
    button.innerText = "...";

    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.style.display = "none";

    // Ensure Dropdown opens to the left
    menu.style.right = "0";

    actions.forEach((action) => {
      const item = document.createElement("button");

      item.type = "button";
      item.className = "dropdown-item";
      item.innerText = action.label;

      item.addEventListener("click", () => {
        menu.style.display = "none";
        action.onClick();
      });

      menu.appendChild(item);
    });

    button.addEventListener("click", (e) => {
      e.stopPropagation();

      menu.style.display =
        menu.style.display === "none"
          ? "block"
          : "none";
    });

    document.addEventListener("click", () => {
      menu.style.display = "none";
    });

    container.append(button, menu);
  }
}
