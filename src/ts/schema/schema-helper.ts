import { JsonSchema } from './json-schema-model';
import { ServiceBase } from '../shared/service-base';


export class SchemaHelper extends ServiceBase {
  constructor(private schema: JsonSchema) {
    super({ name: "SchemaHelper", enableDebug: false });
  }


  /** Normalize field names against schema property keys. */
  findCasing(field: string): string {
    if (!field || !this.schema?.properties)
      return field;

    const keys = Object.keys(this.schema.properties);

    const exact = keys.find(k => k === field);
    if (exact)
      return exact;

    const fieldLc = field.toLowerCase();

    const ci = keys.find(k => k.toLowerCase() === fieldLc);
    if (ci)
      return ci;

    // TODO: not sure what this is for? will disable for now; seems to be an old camelCase comparison
    // const lcFirst = field.charAt(0).toLowerCase() + field.slice(1);
    // const lc = keys.find(
    //   k => k === lcFirst || k.toLowerCase() === lcFirst.toLowerCase()
    // );
    // if (lc)
    //   return lc;
    // handle "id" and "guid" as these are not in the list of provided fields
    if (fieldLc == 'id')
      return 'id';

    if (fieldLc == 'guid')
      return 'guid';

    return field;
  }
}
