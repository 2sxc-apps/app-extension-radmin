/**
 * Table Columns Config
 * This is the format provided by the 2sxc backend.
 */
export interface RadminColumnConfig {
  id: number;
  linkEnable: boolean;
  linkParameters: string
  linkViewId: string | undefined;
  linkViewRef: RadminDetailsViewConfig;
  title: string;
  horizontalAlignment: "automatic" | "left" | "center" | "right";
  width: number | "automatic";
  DataContentType: string;
  tooltipEnabled: boolean;
  guid: string;
  tooltipSelector: string;
  valueFormat: string;
  valueSelector: string;
}

export interface RadminDetailsViewConfig {
  id: number;
  guid: string;
  viewId: string;
  expectedParameters: string;
}