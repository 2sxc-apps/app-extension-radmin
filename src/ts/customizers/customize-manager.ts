import { Options } from "tabulator-tables";
import { TableCustomizer } from "./table-customizer";
import { RadminTableConfig } from "../configs/radmin-table-config";
import { ServiceBase } from '../shared/service-base';
import { CustomizerLoader } from './customizer-loader';

export class CustomizeManager extends ServiceBase {
  private static instance: CustomizeManager | undefined;
  private customizers: TableCustomizer[] = [];
  private activeCustomizers: Map<string, TableCustomizer[]> = new Map();
  private registeredIds: Set<string> = new Set();

  // #region Construction and singleton access

  // debug id to detect duplicates
  private _instanceId: string;

  private constructor() {
    super("CustomizeManager", false);
    this._instanceId = Math.random().toString(36).slice(2, 9);
    this.log(`CustomizeManager initialized with instance ID: ${this._instanceId}`);
  }

  /**
   * Get the singleton instance of the CustomizeManager.
   * This is a plain static singleton (does not use window).
   */
  public static getInstance(): CustomizeManager {
    if (!CustomizeManager.instance)
      CustomizeManager.instance = new CustomizeManager();
    return CustomizeManager.instance!;
  }

  // #endregion

  public async load(customizerDistPath: string | undefined) {
    return new CustomizerLoader(this).load(customizerDistPath);
  }

  /**
   * Register a customizer with the manager. Will dedupe by constructor name by default.
   * If you need a different dedupe key, customizers can expose an `id` string property.
   */
  public registerCustomizer(customizer: TableCustomizer & { id?: string }): void {
    try {
      const id = customizer.id ?? customizer.constructor?.name ?? String(this.customizers.length);
      this.log(`Attempting to register customizer with ID: ${id}`);
      
      if (this.registeredIds.has(id)) {
        // already registered — ignore duplicate registrations
        this.log(`Customizer with ID ${id} already registered - ignoring duplicate`);
        return;
      }
      
      this.registeredIds.add(id);
      this.customizers.push(customizer);
      this.log(`Successfully registered customizer: ${id}`);
      this.log(`Total registered customizers: ${this.customizers.length}`);
    } catch (err) {
      this.log(`Error registering customizer:`, err);
      console.error("[CustomizeManager] registerCustomizer error:", err);
    }
  }

  public registerCustomizers(customizers: Array<TableCustomizer & { id?: string }>): void {
    this.log(`Registering ${customizers.length} customizers`);
    customizers.forEach((c) => this.registerCustomizer(c));
  }

  public getRegisteredCustomizers(): TableCustomizer[] {
    this.log(`Getting all registered customizers: ${this.customizers.length} total`);
    return [...this.customizers];
  }

  /**
   * Apply customizations to the table configuration
   * @param config The original table configuration
   * @returns The modified table configuration
   */
  public customizeConfig(config: RadminTableConfig): RadminTableConfig {
    this.log(`Customizing config for table: ${config.title} (GUID: ${config.guid})`);
    
    // Clear any previously stored active list for this table
    if (this.activeCustomizers.has(config.guid)) {
      this.log(`Clearing previous active customizers for ${config.guid}`);
      this.activeCustomizers.delete(config.guid);
    }

    let modifiedConfig = { ...config };
    const activeCustomizersForThisTable: TableCustomizer[] = [];

    this.log(`Checking ${this.customizers.length} registered customizers for applicability`);
    
    for (const customizer of this.customizers) {
      const customizerName = customizer.constructor?.name || 'Unknown';
      let shouldApply = false;
      
      try {
        shouldApply = customizer.shouldApply(config);
        this.log(`Customizer ${customizerName} shouldApply: ${shouldApply}`);
      } catch (err) {
        this.log(`Error in shouldApply of ${customizerName}:`, err);
        console.error(`[CustomizeManager] Error in shouldApply of ${customizerName}:`, err);
      }
      
      if (shouldApply) {
        this.log(`Adding ${customizerName} to active customizers for this table`);
        activeCustomizersForThisTable.push(customizer);
        
        try {
          this.log(`Applying ${customizerName} to config`);
          const configBefore = JSON.stringify(modifiedConfig);
          modifiedConfig = customizer.customizeConfig(modifiedConfig);
          
          // Check if config was actually modified
          const configChanged = configBefore !== JSON.stringify(modifiedConfig);
          this.log(`Config modified by ${customizerName}: ${configChanged}`);
        } catch (err) {
          this.log(`Error in customizeConfig of ${customizerName}:`, err);
          console.error(`[CustomizeManager] Error in customizeConfig of ${customizerName}:`, err);
        }
      }
    }

    if (activeCustomizersForThisTable.length > 0) {
      this.log(`Storing ${activeCustomizersForThisTable.length} active customizers for table ${config.guid}`);
      this.activeCustomizers.set(config.guid, activeCustomizersForThisTable);
    } else {
      this.log(`No active customizers for table ${config.guid}`);
    }

    return modifiedConfig;
  }

  /**
   * Apply customizations to the Tabulator options
   * @param options The original Tabulator options
   * @param configGuid The GUID of the table configuration
   * @returns The modified Tabulator options
   */
  public customizeTabulator(options: Options, configGuid: string): Options {
    const guid = String(configGuid);
    this.log(`Customizing Tabulator options for table ${guid}`);
    
    let modifiedOptions = { ...options };
    const customizersForThisTable = this.activeCustomizers.get(guid) || [];
    
    this.log(`Found ${customizersForThisTable.length} active customizers for table ${guid}`);

    for (const customizer of customizersForThisTable) {
      const customizerName = customizer.constructor?.name || 'Unknown';
      
      try {
        this.log(`Applying ${customizerName} to Tabulator options`);
        const optionsBefore = JSON.stringify(modifiedOptions);
        modifiedOptions = customizer.customizeTabulator(modifiedOptions);
        
        // Check if options were actually modified
        // Note: This might fail if options contain functions, which don't stringify
        try {
          const optionsChanged = optionsBefore !== JSON.stringify(modifiedOptions);
          this.log(`Tabulator options modified by ${customizerName}: ${optionsChanged}`);
        } catch (e) {
          this.log(`Could not compare options changes (likely contains functions): ${e}`);
        }
      } catch (err) {
        this.log(`Error in customizeTabulator of ${customizerName}:`, err);
        console.error(`[CustomizeManager] Error in customizeTabulator of ${customizerName}:`, err);
      }
    }

    // Log what parts of the options were customized (columns, layout, etc.)
    this.log(`Final Tabulator options keys:`, Object.keys(modifiedOptions));

    return modifiedOptions;
  }
}