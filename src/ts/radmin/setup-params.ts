import { Resources } from "../configs/resources";

export interface SetupParams extends TableSpecs, SearchSpecs {
  moduleId: number;
  errorContainerId?: string;
  customizerDistPath?: string; // Optional app URL for dynamic imports
  resources: Resources;
}

export interface TableSpecs {
  tableName: string;
  canEditConfig: boolean;
  canEditData: boolean;
  exportButtonId?: string;
  /** The view ID (GUID) */
  viewId: string;
}

export interface SearchSpecs {
  searchDomId: string;
  searchContainerDomId: string;
  resources: Resources;
}
