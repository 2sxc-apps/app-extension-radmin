/**
 * Parses a CSV-style sort string (e.g. "Subject:desc,SubSubject:desc")
 * into Tabulator-compatible sort entries: { column: string, dir: "asc"|"desc" }[]
 *
 * Matching against configured column.field, column.title and schema property keys/titles
 * is done case-insensitively and with whitespace-normalization where appropriate.
 */
import { ColumnDef } from "../models/column-def-model";
import { JsonSchema } from "../models/json-schema-model";
import { TabulatorSort } from "../models/tabulator-config-models";
import { ServiceBase } from '../shared/service-base';

export class ColumnSortParser extends ServiceBase {
  constructor() {
    super("ColumnSortParser", false);
  }

  parse(
    sortString?: string,
    columns?: ColumnDef[],
    schema?: JsonSchema
  ): TabulatorSort[] {
    if (!sortString) return [];

    // strip outer quotes if the entire string is quoted (handles the case you hit)
    let input = sortString.trim();
    if (
      (input.startsWith('"') && input.endsWith('"')) ||
      (input.startsWith("'") && input.endsWith("'"))
    ) {
      input = input.slice(1, -1).trim();
      this.log("[ColumnSortParser] stripped outer quotes from input:", input);
    } else {
      this.log("[ColumnSortParser] parse called with:", input);
    }

    const normalize = (s = "") => s.replace(/^["']|["']$/g, "").trim();

    // Tokenize CSV while respecting quoted tokens
    let tokens =
      input
        .match(/(?:[^,"']+|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')+/g)
        ?.map((t) => t.trim())
        .filter(Boolean) || [];

    this.log("[ColumnSortParser] initial tokens:", tokens);

    // If input used only colons (e.g. "A:desc:B:asc") without commas, split into pairs
    if (tokens.length === 1 && tokens[0].includes(":")) {
      const parts = tokens[0]
        .split(":")
        .map((p) => p.trim())
        .filter(Boolean);
      // if there are at least 2 parts and an even number (name,dir pairs), rebuild tokens
      if (parts.length >= 2 && parts.length % 2 === 0) {
        const rebuilt: string[] = [];
        for (let i = 0; i < parts.length; i += 2) {
          rebuilt.push(`${parts[i]}:${parts[i + 1]}`);
        }
        tokens = rebuilt;
        this.log(
          "[ColumnSortParser] rebuilt tokens from colon-only input:",
          tokens
        );
      } else {
        this.log(
          "[ColumnSortParser] colon-only token present but parts are not even - parts:",
          parts
        );
      }
    }

    // Build lookup maps to make resolveToField fast and concise
    const colFieldByLower = new Map<string, string>();
    const colTitleByLower = new Map<string, string>();
    const colTitleByNormalized = new Map<string, string>();

    (columns || []).forEach((c) => {
      if (c.field) colFieldByLower.set(c.field.toLowerCase(), c.field);
      if (c.title) {
        const titleStr = c.title.toString();
        colTitleByLower.set(titleStr.toLowerCase(), c.field ?? titleStr);
        colTitleByNormalized.set(
          titleStr.toLowerCase().replace(/\s+/g, ""),
          c.field ?? titleStr
        );
      }
    });

    this.log("[ColumnSortParser] column lookup sizes:", {
      fields: colFieldByLower.size,
      titles: colTitleByLower.size,
      titlesNormalized: colTitleByNormalized.size,
    });

    const schemaProps = schema?.properties || {};
    const schemaKeys = Object.keys(schemaProps);
    const schemaKeyByLower = new Map<string, string>();
    const schemaTitleByLower = new Map<string, string>();
    const schemaTitleByNormalized = new Map<string, string>();

    schemaKeys.forEach((k) => {
      schemaKeyByLower.set(k.toLowerCase(), k);
      const title = (schemaProps[k]?.title || "").toString();
      if (title) {
        schemaTitleByLower.set(title.toLowerCase(), k);
        schemaTitleByNormalized.set(title.toLowerCase().replace(/\s+/g, ""), k);
      }
    });

    this.log("[ColumnSortParser] schema lookup sizes:", {
      keys: schemaKeyByLower.size,
      titles: schemaTitleByLower.size,
      titlesNormalized: schemaTitleByNormalized.size,
    });

    const resolveToField = (rawName: string): string => {
      const cleaned = normalize(rawName);
      const lower = cleaned.toLowerCase();
      const normalized = lower.replace(/\s+/g, "");

      // configured column.field (case-insensitive)
      const byField = colFieldByLower.get(lower);
      if (byField) {
        this.log(
          `[ColumnSortParser] resolved "${rawName}" => column.field (by field):`,
          byField
        );
        return byField;
      }

      // configured column.title (case-insensitive)
      const byTitle =
        colTitleByLower.get(lower) ?? colTitleByNormalized.get(normalized);
      if (byTitle) {
        this.log(
          `[ColumnSortParser] resolved "${rawName}" => column.field (by title):`,
          byTitle
        );
        return byTitle;
      }

      // schema property key (case-insensitive)
      const bySchemaKey = schemaKeyByLower.get(lower);
      if (bySchemaKey) {
        this.log(
          `[ColumnSortParser] resolved "${rawName}" => schema key:`,
          bySchemaKey
        );
        return bySchemaKey;
      }

      // schema property title (case-insensitive / normalized)
      const bySchemaTitle =
        schemaTitleByLower.get(lower) ??
        schemaTitleByNormalized.get(normalized);
      if (bySchemaTitle) {
        this.log(
          `[ColumnSortParser] resolved "${rawName}" => schema title:`,
          bySchemaTitle
        );
        return bySchemaTitle;
      }

      // fallback to cleaned token (Tabulator will attempt to match)
      this.log(
        `[ColumnSortParser] fallback resolution for "${rawName}" =>`,
        cleaned
      );
      return cleaned;
    };

    const result: TabulatorSort[] = tokens.map((segment) => {
      // remove surrounding quotes from the whole token before splitting
      const token = normalize(segment);

      // split on the first colon only
      const idx = token.indexOf(":");
      const namePart = idx === -1 ? token : token.substring(0, idx);
      const dirPart = idx === -1 ? "" : token.substring(idx + 1);

      const nameToken = normalize(namePart);
      const dirToken = normalize(dirPart).toLowerCase();

      // Robustly accept desc / descending / d / - or anything starting with 'd'
      const dir: "asc" | "desc" = /^(-|desc|descending|d)/.test(dirToken)
        ? "desc"
        : "asc";

      const resolved = {
        // use Tabulator's expected property name when passing sorts in
        column: resolveToField(nameToken),
        dir,
      };

      this.log("[ColumnSortParser] parsed segment:", {
        raw: segment,
        token,
        nameToken,
        dirToken,
        resolved,
      });

      return resolved;
    });

    this.log("[ColumnSortParser] final parsed sorters:", result);
    return result;
  }
}
