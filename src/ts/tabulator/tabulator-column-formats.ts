import { CellComponent, ColumnDefinition, FormatterParams } from 'tabulator-tables';
import { DateTime } from 'luxon';

/**
 * Formatter function to show dates without time in short form.
 * @param cell 
 * @param formatterParams 
 * @returns 
 */
function dateTimeFormatter(cell: CellComponent, formatterParams: FormatterParams) {
  var value = cell.getValue();
  if (!value)
    return ""; // Handle empty cells

  // This tells Luxon: "Read this and stay in UTC mode"
  var dt = DateTime.fromISO(value, { zone: "utc" });

  return (dt.hour === 0 && dt.minute === 0)
    ? dt.toFormat("yyyy-MM-dd")
    : dt.toFormat("yyyy-MM-dd HH:mm");
};

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
      outputFormat: "yyyy-MM-dd",
    },
  },
  "date-time": {
    hozAlign: "right",
    formatter: dateTimeFormatter, // "datetime",
    // formatterParams: {
    //   inputFormat: "yyyy-MM-dd'T'HH:mm:ss'Z'",
    //   outputFormat: "yyyy-MM-dd HH:mm:ss",
    // },
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
