import { Tabulator } from 'tabulator-tables';
import { SearchSpecs } from '../../radmin/setup-params';
import { ServiceBase } from '../../shared/service-base';

export class RadTabSetupSearch extends ServiceBase {

  constructor() {
    super({ name: "RadTabSetupSearch", enableDebug: false });
  }

  connectSearch(table: Tabulator, filterName: string) {
    const filterInput = this.getSearchInput(filterName);
    if (!filterInput) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") e.preventDefault();
    };

    const onInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value;
      table.setFilter(this.matchAny, { value });
    };

    filterInput.addEventListener("keydown", onKeyDown);
    filterInput.addEventListener("input", onInput);
    this.log("Search input wired", filterName);
  }

  /**
   * Create search input element and place it next to the table heading
   * Uses module ID to ensure targeting the correct instance
   */
  createSearchInput(specs: SearchSpecs): void {
    // Find container for the search input or exit
    const searchContainer = document.getElementById(specs.searchContainerDomId);
    if (!searchContainer)
      return;

    // Create search input
    const searchInput = document.createElement("input");
    searchInput.className = "form-control";
    searchInput.type = "text";
    searchInput.placeholder = specs.resources.SearchLabel || "Search...";
    searchInput.id = specs.searchDomId;

    // Append to DOM
    searchContainer.appendChild(searchInput);
  }

  /**
   * Custom filter function that matches any field in a row against the search term
   */
  matchAny(data: any, filterParams: any, row?: any): boolean {
    const searchEnabled = filterParams.value?.toString().toLowerCase() || "";
    if (!searchEnabled)
      return true;

    // Check row cells if row object is available
    if (row?.getCells) {
      for (const cell of row.getCells()) {
        const value = cell.getValue();
        if (value != null && String(value).toLowerCase().includes(searchEnabled))
          return true;
      }
      return false;
    }

    // Fallback: searchEnabled in the data object
    for (const key in data) {
      const value = data[key];
      if (value != null) {
        const stringValue = typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
        if (stringValue.toLowerCase().includes(searchEnabled))
          return true;
      }
    }

    return false;
  }

  /**
   * Get the search input element for Tabulator
   */
  getSearchInput(filterName: string) : HTMLInputElement | undefined {
    const filterInput = document.querySelector<HTMLInputElement>(`#${filterName}`);

    if (!filterInput) {
      console.warn(`Search input with ID ${filterName} not found`);
      return;
    }

    return filterInput;
  }
}
