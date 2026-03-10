import { Sxc } from '@2sic.com/2sxc-typings';
import { CustomizeManager } from '../customizers/customize-manager';
import { SchemaProvider } from '../providers/schema-provider';
import { ServiceBase } from '../shared/service-base';
import { TabulatorAdapter } from './tabulator-adapter';


export class TableServices extends ServiceBase {
  constructor(sxc: Sxc) {
    super("TableServices", false);
    this.adapter = new TabulatorAdapter();
    this.log("Created TabulatorAdapter");
    this.schemaProvider = new SchemaProvider(sxc);
    this.log("Created SchemaProvider");
    this.customizeManager = CustomizeManager.getInstance();
    this.log("Retrieved CustomizeManager instance");
  }

  public adapter: TabulatorAdapter;

  public schemaProvider: SchemaProvider;
  public customizeManager: CustomizeManager;

}
