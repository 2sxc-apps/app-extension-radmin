import { Resources } from '../models/resources';


export interface SetupParams extends TableSetupSpecs {
  moduleId: number;
  errorContainerId?: string;
  customizerDistPath?: string; // Optional app URL for dynamic imports
  resources: Resources;
}

export interface TableSetupSpecs {
  tableName: string;
  filterName: string;
  canEditConfig: boolean;
  canEditData: boolean;

  /** The view ID (GUID) */
  viewId: string;
}