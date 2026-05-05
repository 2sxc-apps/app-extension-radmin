

export interface IDomAdapter {
  getElement(): HTMLElement;
}

export interface IRowAdapter extends IDomAdapter {
  getData(): any;
}

export interface IColumnToolbarAdapter extends IDomAdapter {
  fieldName: string;
  title: string;
}
