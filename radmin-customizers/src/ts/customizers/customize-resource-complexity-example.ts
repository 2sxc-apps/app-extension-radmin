import { Options } from "tabulator-tables";
import { CellComponent } from "tabulator-tables";
import { TableCustomizer } from "../../../../extensions/radmin/src/customizers/table-customizer";
import { RadminTableConfig } from "../../../../extensions/radmin/src/configs/radmin-table-config";

// Example: renders a 1-10 complexity value as stars.
// To create your own: copy this file, set targetKey, implement the three methods, register in customizers.ts.
export class CustomizeResourcesTable implements TableCustomizer {

  private readonly targetKey = "resources";

  // Return true to activate this customizer for the given table, false to skip it
  shouldApply(config: RadminTableConfig): boolean {
    const normalizedType = (config.viewId ?? "").toLowerCase();
    return normalizedType === this.targetKey;
  }

  // Modify the Radmin table config (title, column definitions, etc.) - return it unchanged if not needed
  customizeConfig(config: RadminTableConfig): RadminTableConfig {
    return config;
  }

  // Modify the Tabulator options object - see https://tabulator.info/docs/6.3/options
  customizeTabulator(options: Options): Options {
    const getValueIgnoreCase = (row: Record<string, unknown>, key: string): unknown => {
      const matchedKey = Object.keys(row).find((k) => k.toLowerCase() === key);
      return matchedKey ? row[matchedKey] : undefined;
    };

    const findColumn = (columns: any[]): any | undefined => {
      for (const column of columns) {
        const field = (column?.field ?? "").toLowerCase();
        if (field === "complexity" || field === "id") {
          return column;
        }

        if (Array.isArray(column?.columns)) {
          const nested = findColumn(column.columns);
          if (nested) {
            return nested;
          }
        }
      }

      return undefined;
    };

    if (options.columns) {
      // Prefer a dedicated complexity column; fallback to id if complexity is stored there.
      const complexityCol = findColumn(options.columns as any[]);

      if (complexityCol) {
        complexityCol.formatter = (cell: CellComponent) => {
          const rowData = cell.getRow().getData() as Record<string, unknown>;
          const rawValue = getValueIgnoreCase(rowData, "complexity");
          const value = Number(rawValue);

          if (!Number.isFinite(value)) {
            return "";
          }

          const score = Math.max(1, Math.min(10, Math.round(value)));
          const filledStars = "★".repeat(score);
          const emptyStars = "☆".repeat(10 - score);

          return `${filledStars}${emptyStars} ${score}/10`;
        };
      }
    }

    return options;
  }
}
