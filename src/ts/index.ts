import { RadminMain } from "./radmin/radmin-main";

const win = window as any;

win.radmin ??= new RadminMain();

console.log("Loading Radmin v0.4.xx");
