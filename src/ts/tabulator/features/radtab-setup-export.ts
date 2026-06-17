import { Tabulator } from "tabulator-tables";

export class RadTabSetupExport {
  createAction(table: Tabulator, fileName?: string) {
    return {
      label: "Export CSV",
      onClick: () => {
        table.download("csv", fileName || "data.csv", {
          bom: true,
          delimiter: ";",
        });
      },
    };
  }

  setup(table: Tabulator, containerId?: string, fileName?: string) {
    const container = containerId ? document.getElementById(containerId) : null;

    if (!container) return;

    const button = document.createElement("button");
    button.className = "btn btn-outline-secondary";
    button.type = "button";
    button.innerText = "Export CSV";

    button.addEventListener("click", () => {
      table.download("csv", fileName || "data.csv", {
        bom: true, // UTF-8 fix
        delimiter: ";", // Excel compatibility
      });
    });

    container.appendChild(button);
  }
}
