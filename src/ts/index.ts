import { RadminMain } from "./radmin/radmin-main";

const win = window as any;
// win.table ??= {};

win.radmin ??= new RadminMain();

console.log("2dm radmin version 0.4.xx");
