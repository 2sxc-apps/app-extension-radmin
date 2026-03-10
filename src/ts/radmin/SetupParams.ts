import { Resources } from '../models/resources';


export interface SetupParams {
  tableName: string;
  filterName: string;
  moduleId: number;
  viewId: string;
  errorContainerId?: string;
  canEditConfig: boolean;
  canEditData: boolean;
  customizerDistPath?: string; // Optional app URL for dynamic imports
  resources: Resources;
}
