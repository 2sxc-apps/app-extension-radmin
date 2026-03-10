import { Sxc } from '@2sic.com/2sxc-typings';
import { CustomizeManager } from '../customizers/customize-manager';
import { SchemaLoader } from '../loaders/schema-loader';
import { ServiceBase } from '../shared/service-base';
import { TabulatorAdapter } from './tabulator-adapter';
import { RadminTableConfig } from '../configs/radmin-table-config';
import { DataProviderEntities } from '../providers/data-provider-entities';
import { DataProviderFactory } from '../providers/data-provider-factory';
import { JsonSchema } from '../models/json-schema-model';
import { ErrorHelper } from '../helpers/error-helper';


abstract class TableServicesBase extends ServiceBase {
  constructor(logEnabled: boolean,
    name: string,
    public sxc: Sxc,
    public adapter: TabulatorAdapter,
    public schemaProvider: SchemaLoader,
    public customizeManager: CustomizeManager,
  ) {
    super({ name, enableDebug: logEnabled });
  }
}

export class TableServices extends TableServicesBase {
  constructor(sxc: Sxc) {
    super(false, "TableServices",
      sxc,
      new TabulatorAdapter(),
      new SchemaLoader(sxc),
      CustomizeManager.getInstance(),
    );
  }

  public async getComplete(tableConfigData: RadminTableConfig, viewId: string, linkParameters: string | undefined): Promise<TableServicesComplete> {
    // Setup data provider based on config
    const dataProvider = new DataProviderFactory().getDataProvider(tableConfigData, this.sxc, linkParameters)

    const schema = await this.loadSchema(this.schemaProvider, viewId);
    return new TableServicesComplete(this, dataProvider, schema);
  }

  private async loadSchema(schemaProvider: SchemaLoader, viewId: string): Promise<JsonSchema> {
    try {
      const schema = await schemaProvider.getSchema(viewId);
      this.log("schema loaded", schema);

      // Check if schema is valid
      if (!schema || !schema.properties) {
        throw new Error("Invalid schema: missing properties");
      }
      return schema;
    } catch (error: unknown) {
      const errStr = ErrorHelper.toErrorString(error);
      this.log("Error loading schema:", errStr);
      throw new Error(`Schema loading failed: ${errStr}`);
    }
  }

}

export class TableServicesComplete extends TableServicesBase {
  constructor(
    services: TableServicesBase,
    public dataProvider: DataProviderEntities,
    public schema: JsonSchema,
  ) {
    super(true, "TableServicesComplete",
      services.sxc,
      services.adapter,
      services.schemaProvider,
      services.customizeManager
    );
  }
}
