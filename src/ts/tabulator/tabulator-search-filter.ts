import { SearchSpecs } from '../radmin/setup-params';

export class TabulatorSearchFilter {
  /**
   * Create filter input element and place it next to the table heading
   * Uses module ID to ensure targeting the correct instance
   */
  createFilterInput(specs: SearchSpecs): void {
    // Find container for the filter or exit
    const filterContainer = document.getElementById(specs.searchContainerDomId);
    if (!filterContainer)
      return;

    // Create search input
    const filterInput = document.createElement("input");
    filterInput.className = "form-control";
    filterInput.type = "text";
    filterInput.placeholder = specs.resources.SearchLabel || "Search...";
    filterInput.id = specs.searchDomId;

    // Append to DOM
    filterContainer.appendChild(filterInput);
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
   * Get the filter function for Tabulator
   */
  getFilterFunction(filterName: string) {
    const filterInput = document.querySelector<HTMLInputElement>(`#${filterName}`);

    if (!filterInput) {
      console.warn(`Filter input with ID ${filterName} not found`);
      return;
    }

    return filterInput;
  }
}
