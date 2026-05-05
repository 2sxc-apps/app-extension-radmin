import { Sxc } from '@2sic.com/2sxc-typings';
import { DataProviderBase } from './data-provider-base';
import { RadminTableConfig } from '../../configs/radmin-table-config';

const debug = true;

export class DataProviderQuery extends DataProviderBase {
  #sxc: Sxc;
  #query: string;
  #stream: string;

  constructor(sxc: Sxc, tableConfigData: RadminTableConfig, linkParameters?: string) {

    const query = tableConfigData.dataQuery;
    const stream = tableConfigData.dataQueryStream || '';
    const paramsPreset = tableConfigData.dataQueryParameters;

    // Create the final parameters, if there are presets, we append them to the link parameters
    let linkParametersFinal = linkParameters || '';
    if (paramsPreset)
      linkParametersFinal += (linkParametersFinal && paramsPreset ? '&' : '') + paramsPreset;

    // If there is a parameter, make sure it's prefixed with a "?" for the API call
    if (linkParametersFinal && !linkParametersFinal.startsWith('?'))
      linkParametersFinal = '?' + linkParametersFinal;

    // Build the full API URL
    const endpoint = `app/auto/query/${query}/${stream}${linkParametersFinal}`;
    const apiUrl = sxc.webApi.url(endpoint);

    if (debug)
      console.log(`DataProviderQuery`, { query, stream, paramsPreset, linkParametersFinal, apiUrl });

    // Initialize the base provider
    super(apiUrl, sxc.webApi.headers('GET'));

    // Store references for later use
    this.#sxc = sxc;
    this.#query = tableConfigData.dataQuery;
    this.#stream = tableConfigData.dataQueryStream || '';
  }

  /**
   * Override getInitialData to include relationship processing
   */
  async getInitialData(): Promise<unknown[]> {
    try {
      // Fetch data from the endpoint
      const data = await this.#sxc.webApi.fetchJson(this.apiUrl);

      // Process the data using our method
      return this.#processQueryData(data, this.#query);
    } catch (error) {
      console.error(`Error loading data from query ${this.#query}:`, error);
      return [];
    }
  }

  /**
   * Process raw data without fetching it - can be used by ajaxResponse
   */
  processData(data: string) {
    return this.#processQueryData(data, this.#query);
  }

  /**
   * Private helper to process query data to handle relationships
   */
  #processQueryData(data: any, queryName: string): any[] {
    // let mainKey = queryName;
    let mainItems = data[this.#stream] || data['Default'];

    if (!Array.isArray(mainItems))
      return [];

    const lookupMaps: Record<string, Record<number, any>> = {};
    Object.keys(data).forEach((key) => {
      if (key === this.#stream)
        return;
      const arr = data[key];
      if (
        Array.isArray(arr) &&
        arr.length > 0 &&
        arr[0] &&
        Object.prototype.hasOwnProperty.call(arr[0], 'Id')
      ) {
        lookupMaps[key] = arr.reduce((map: Record<number, any>, item: any) => {
          map[item.Id] = item;
          return map;
        }, {});
      }
    });

    const combined = mainItems.map((item: any) => {
      const newItem: any = {};
      Object.keys(item).forEach((field) => {
        let value = item[field];
        if (lookupMaps[field] && Array.isArray(value)) {
          value =
            value.length > 0
              ? lookupMaps[field][value[0].Id] || value[0]
              : null;
        }
        // Convert PascalCase to lowerCamelCase
        const camelField = field.charAt(0).toLowerCase() + field.slice(1);
        newItem[camelField] = value;
      });
      return newItem;
    });

    return combined;
  }
}
