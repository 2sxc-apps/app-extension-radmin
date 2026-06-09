import { Tabulator } from "tabulator-tables";

export class RadTabSetupExport {
  setup(table: Tabulator, buttonId?: string, filename = "data.csv") {
    if (!buttonId) return;

    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.addEventListener("click", () => {
      table.download("csv", filename, {
        bom: true, // UTF-8 fix
        delimiter: ";", // Excel compatibility
      });
    });
  }
}
