import { Tabulator } from "tabulator-tables";

export class RadTabRegisterSort {
  /**
   * Registers a custom sorter with Tabulator to safely handle object/array values.
   * Uses Tabulator.extendModule (static) to avoid prototype access and keep typings clean.
   */
  registerSortObjectAndArray() {
    try {
      // Tabulator exposes extendModule as a static method. Use that to register a named sorter.
      Tabulator.extendModule("sort", "sorters", {
        object: function (a: unknown, b: unknown) {
          const normalize = (v: unknown): string => {
            if (v === null || v === undefined)
              return "";

            if (Array.isArray(v)) {
              if (v.length === 0)
                return "";
              const first = v[0];
              return (first?.Title ?? first?.title ?? String(first)) as string;
            }

            if (typeof v === "object") {
              const o: any = v;
              return (o?.Title ?? o?.title ?? JSON.stringify(o)) as string;
            }
            return String(v);
          };

          const va = normalize(a);
          const vb = normalize(b);

          if (va === vb)
            return 0;

          // localeCompare gives a robust string comparison
          return va.localeCompare(vb, undefined, { sensitivity: "base" }) < 0
            ? -1
            : 1;
        },
      });
    } catch (err) {
      console.warn("Failed to register custom object sorter", err);
    }
  }
}
