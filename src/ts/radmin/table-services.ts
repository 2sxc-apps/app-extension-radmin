import { Sxc } from '@2sic.com/2sxc-typings';
import { CustomizeManager } from '../customizers/customize-manager';
import { SchemaLoader } from './schema/schema-loader';
import { ServiceBase } from '../shared/service-base';
import { RadminTableConfig } from '../configs/radmin-table-config';
import { DataProviderEntities } from './data/data-provider-entities';
import { DataProviderFactory } from './data/data-provider-factory';
import { JsonSchema } from './schema/json-schema-model';
import { ErrorHelper } from '../shared/error-helper';
import { VisualizerBootstrapper } from './visualizer/visualizer-bootstrapper';
import { AdapterService } from './adapters/adapter-service';


export class TableServices extends ServiceBase {
  constructor(logEnabled: boolean,
    public sxc: Sxc,
    public table: VisualizerBootstrapper,
    public schemaProvider: SchemaLoader,
    public customizeManager: CustomizeManager,

    public dataProvider: DataProviderEntities,
    public schema: JsonSchema,
  ) {
    super({ name: 'TableServices', enableDebug: logEnabled });
  }
}

export class TableServicesFactory extends ServiceBase {
  constructor(public sxc: Sxc) {
    super({ name: "TableServicesFactory", enableDebug: false });
  }
  public customizeManager = CustomizeManager.getInstance();

  public async getServices(tableConfigData: RadminTableConfig, viewId: string, linkParameters: string | undefined): Promise<TableServices> {
    // Setup data provider based on config
    const dataProvider = new DataProviderFactory().getDataProvider(tableConfigData, this.sxc, linkParameters)

    const schemaProvider = new SchemaLoader(this.sxc);
    const schema = await this.#loadSchema(schemaProvider, viewId);

    const adapterSvc = new AdapterService();
    return new TableServices(
      this.enableDebug,
      this.sxc,
      adapterSvc.getTableAdapter() /* new TabulatorTableAdapter() */,
      schemaProvider,
      this.customizeManager,
      dataProvider,
      schema
    );

  }


  async #loadSchema(schemaProvider: SchemaLoader, viewId: string): Promise<JsonSchema> {
    try {
      const schema = await schemaProvider.getSchema(viewId);
      this.log("schema loaded", schema);

      // Check if schema is valid
      if (!schema || !schema.properties)
        throw new Error("Invalid schema: missing properties");
      return schema;
    } catch (error: unknown) {
      const errStr = ErrorHelper.toErrorString(error);
      this.log("Error loading schema:", errStr);
      throw new Error(`Schema loading failed: ${errStr}`);
    }
  }

}
