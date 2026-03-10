import { Resources } from '../models/resources';


export interface SetupParams extends TableSetupSpecs, SearchSpecs {
  moduleId: number;
  errorContainerId?: string;
  customizerDistPath?: string; // Optional app URL for dynamic imports
  resources: Resources;
}

export interface TableSetupSpecs {
  tableName: string;
  canEditConfig: boolean;
  canEditData: boolean;

  /** The view ID (GUID) */
  viewId: string;
}

export interface SearchSpecs {
  searchDomId: string;
  searchContainerDomId: string;
  resources: Resources;
}