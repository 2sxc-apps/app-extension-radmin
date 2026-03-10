import { ErrorHelper } from '../helpers/error-helper';
import { ServiceBase } from '../shared/service-base';
import { CustomizeManager } from './customize-manager';

export class CustomizerLoader extends ServiceBase {
  constructor(private manager: CustomizeManager) {
    super("CustomizerLoader", false);
  }
  
  // TODO: Move to another class, as soon as we can test it!
  public async load(customizerDistPath: string | undefined) {
    if (!customizerDistPath) {
      this.log("No customizerDistPath provided, skipping customizer loading");
      return;
    }

    this.log("Using app URL for customizers:", customizerDistPath);

    // Create full URL with cache-busting parameter for development
    const timestamp = new Date().getTime();
    const distPath = `${customizerDistPath}?v=${timestamp}`;

    this.log("Attempting to load customizers from:", distPath);
    try {
      const preloadLink = document.createElement("link");
      preloadLink.rel = "modulepreload";
      preloadLink.href = distPath;
      document.head.appendChild(preloadLink);

      const importResult = await import(/* webpackIgnore: true */ distPath);

      this.log("Import successful, module keys:", Object.keys(importResult));
      this.log("Module content:", importResult);

      if (importResult && Array.isArray(importResult.customizers)) {
        const customizerClasses = importResult.customizers;

        const customizerInstances = customizerClasses
          .map((CustomizerClass: any) => {
            try {
              const instance = new CustomizerClass();
              this.log(`Instantiated customizer: ${instance.constructor.name}`);
              return instance;
            } catch (error) {
              this.log(`Error instantiating customizer:`, error);
              return null;
            }
          })
          .filter(Boolean);

        if (customizerInstances.length) {
          this.log(`Registering ${customizerInstances.length} user customizers`);
          this.manager.registerCustomizers(customizerInstances);
          this.log(`Customizers registered successfully`);
        }
      } else {
        this.log("No valid customizers array found in imported module");
        this.log("Available exports:", Object.keys(importResult));
      }
    } catch (error) {
      this.log(
        `Error during dynamic import:`,
        ErrorHelper.toErrorString(error)
      );
    }
  }
}