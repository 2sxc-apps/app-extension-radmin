import { Tabulator } from "tabulator-tables";
import { SearchSpecs } from "../../radmin/setup-params";

export class RadTabSetupExport {
  createAction(table: Tabulator, specs: SearchSpecs, fileName?: string) {
    return {
      label: specs?.resources.ExportButtonLabel || "Export CSV",
      onClick: () => {
        table.download("csv", fileName || "data.csv", {
          bom: true,
          delimiter: ";",
        });
      },
    };
  }
}
