/**
 * Table Columns Config
 * This is the format provided by the 2sxc backend.
 */
export interface RadminColumnConfig {
  id: number;
  guid: string;
  title: string;

  /** new 01.00.01 */
  hide: boolean;

  fieldValue: string;
  fieldFormat: string;
  fieldTemplate: string;

  horizontalAlignment: "automatic" | "left" | "center" | "right";
  width: number | "automatic";
  
  fieldTooltip: string;
  headerTooltip: string;
  
  linkType: '' | 'page' | 'url' | 'view' | 'view-dynamic';
  linkViewRef: RadminDetailsViewConfig;
  linkViewId: string | undefined;
  linkParameters: string;
  linkUrl: string;
  linkTarget: "_self" | "_blank";

}

interface RadminDetailsViewConfig {
  id: number;
  guid: string;
  viewId: string;
  expectedParameters: string;
}