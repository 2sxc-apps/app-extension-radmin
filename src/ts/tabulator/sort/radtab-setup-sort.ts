import { Options, Sorter, Tabulator } from 'tabulator-tables';
import { ServiceBase } from '../../shared/service-base';
import { ErrorHelper } from '../../shared/error-helper';

export class RadTabSetupSort extends ServiceBase {

  constructor() {
    super({ name: "RadTabSetupSort", enableDebug: true });
  }

  loadSortFromSession(tableName: string): Sorter[] | null {
    const savedSortersJson = sessionStorage.getItem(`${tableName}-sorters`);
    if (!savedSortersJson)
      return null;

    try {
      const savedSorters = JSON.parse(savedSortersJson) as Sorter[];
      if (Array.isArray(savedSorters) && savedSorters.length > 0)
        return this.retLog(savedSorters, `Loaded saved sorters for ${tableName}`);
    } catch (err) {
      this.log(`Failed to parse saved sorters for ${tableName}`, err);
    }
    return null;
  }

  
  setupInitialSort(table: Tabulator, tabulatorOptions: Options, tableName: string) {
    const initialSortRaw = tabulatorOptions.initialSort as Array<{ field?: string; column?: string; dir: "asc" | "desc"; }>
      | undefined;

    if (!initialSortRaw?.length)
      return;

    try {

      // normalize into Tabulator Sorter[] (must include 'column')
      const initialSort = initialSortRaw.map((s) => ({
        column: s.column ?? s.field ?? "",
        dir: s.dir,
      })) as Sorter[];

      this.log("initialSort provided (for Tabulator)", initialSort);

      // apply only after dataLoaded to avoid early pipelines errors
      table.on("dataLoaded", () => {
        this.log("dataLoaded event — applying initialSort", initialSort);
        try {
          table.setSort(initialSort);
        } catch (error) {
          this.log("setSort on dataLoaded failed:", ErrorHelper.toErrorString(error));
        }

        table.on("dataSorted", function (sorters, rows) {
          if (sorters.length === 0)
            return;

          const cleanSorters = sorters.map((s) => ({
            field: s.field || s.column.getField(),
            dir: s.dir,
          }));

          sessionStorage.setItem(
            `${tableName}-sorters`,
            JSON.stringify(cleanSorters)
          );
        });
      });
    } catch (error) {
      this.log(
        "error scheduling initialSort application:",
        ErrorHelper.toErrorString(error)
      );
    }
  }
}