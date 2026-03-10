/**
 * Table Columns Config
 * This is the format provided by the 2sxc backend.
 */
export interface RadminColumnConfig {
  id: number;
  guid: string;
  title: string;

  fieldValue: string;
  fieldFormat: string;

  horizontalAlignment: "automatic" | "left" | "center" | "right";
  width: number | "automatic";
  // dataContentType: string;
  
  tooltipEnabled: boolean;
  fieldTooltip: string;
  headerTooltip: string;
  
  linkEnable: boolean;
  linkType: '' | 'page' | 'url' | 'view' | 'view-dynamic';
  linkViewRef: RadminDetailsViewConfig;
  linkViewId: string | undefined;
  linkParameters: string;
  linkUrl: string;
  linkTarget: "_self" | "_blank";

}  

export interface RadminDetailsViewConfig {
  id: number;
  guid: string;
  viewId: string;
  expectedParameters: string;
}