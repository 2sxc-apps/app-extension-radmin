import { ColumnDefinition } from 'tabulator-tables';

export const formatConfigs: Record<string, Partial<ColumnDefinition>> = {
  "": {},
  number: {
    hozAlign: "right",
  },
  boolean: {
    hozAlign: "center",
    formatter: "tickCross",
  },
  date: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy",
    },
  },
  "date-time": {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "dd/MM/yy HH:mm:ss",
    },
  },
  time: {
    hozAlign: "right",
    formatter: "datetime",
    formatterParams: {
      inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
      outputFormat: "HH:mm:ss",
    },
  },
  progress: {
    formatter: "progress",
    formatterParams: {
      min: 0,
      max: 100,
      color: ["#31B4E8"],
    },
  },
};
