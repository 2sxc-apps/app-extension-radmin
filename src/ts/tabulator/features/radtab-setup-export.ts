import { Tabulator } from "tabulator-tables";

export class RadTabSetupExport {
  setup(table: Tabulator, containerId?: string, fileName?: string) {
    const container = containerId ? document.getElementById(containerId) : null;

    if (!container) return;

    const btn = document.createElement("button");
    btn.className = "btn btn-sm btn-outline-secondary";
    btn.type = "button";
    btn.innerText = "Export CSV";

    btn.addEventListener("click", () => {
      table.download("csv", fileName || "data.csv", {
        bom: true, // UTF-8 fix
        delimiter: ";", // Excel compatibility
      });
    });

    container.appendChild(btn);
  }
}
