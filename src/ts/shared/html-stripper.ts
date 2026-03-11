import { CellComponent } from "tabulator-tables";

/**
 * HtmlStripper
 * - detects HTML-like values
 * - decodes HTML entities / escaped unicode (\u003c)
 * - strips HTML tags
 * - exposes a Tabulator formatter that returns plain text
 */
export class HtmlStripper {
  // enable to see debug logs
  static debug = false;

  private static log(...args: any[]) {
    if (this.debug) console.log("[HtmlStripper]", ...args);
  }

  /**
   * Quick heuristic: does this look like HTML or encoded HTML?
   */
  static looksLikeHtml(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    const s = String(value);
    // direct tags, encoded entities (&lt;), or unicode-escaped sequences (\u003c)
    return /<[a-zA-Z][\s\S]*>|&lt;|\\u003c|\\u003e/i.test(s);
  }

  /**
   * Decode entities and unicode-escaped sequences into a usable HTML string.
   * Uses DOM decoding where available, falls back to simple replacements.
   */
  static decodeEntities(input: string): string {
    if (!input) return "";
    // Normalize JS-escaped unicode sequences
    let s = input.replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">");
    this.log("decodeEntities: after unicode normalization:", s);

    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      // Using innerHTML lets the browser decode entities
      div.innerHTML = s;
      return div.textContent ?? div.innerText ?? "";
    }

    // Fallback when DOM isn't available (e.g., server-side)
    return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
  }

  /**
   * Remove HTML tags from a string. Uses DOM if possible otherwise naive regex strip.
   */
  static stripHtml(html: string): string {
    if (!html) return "";
    if (typeof document !== "undefined") {
      const div = document.createElement("div");
      div.innerHTML = html;
      return div.textContent ?? div.innerText ?? "";
    }
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  }

  /**
   * Combined helper: decode entities then strip tags -> plain text
   */
  static decodeAndStrip(value: unknown): string {
    if (value === null || value === undefined) return "";
    const s = String(value);
    return HtmlStripper.stripHtml(HtmlStripper.decodeEntities(s));
  }

  /**
   * Tabulator-compatible formatter that decodes & strips HTML to plain text.
   */
  static plainTextFormatter = (cell: CellComponent) => {
    try {
      const val = cell?.getValue?.();
      return HtmlStripper.decodeAndStrip(val);
    } catch (err) {
      this.log("plainTextFormatter error:", err);
      return "";
    }
  };

  /**
   * Schema-aware check: does the SchemaProperty indicate a rich/html input?
   * Accepts values like "string-wysiwyg", "wysiwyg", "html", "richtext", etc.
   *
   * We check inputType, format, description, name and title (for backends that put metadata in non-standard fields).
   */
  static schemaPropertyIndicatesHtml(
    prop?: Partial<{
      inputType: string;
      format: string;
      type: string;
      description: string;
      name: string;
      title: string;
    }>
  ): boolean {
    if (!prop) return false;
    const combined = [
      prop.inputType,
      prop.format,
      prop.description,
      prop.name,
      prop.title,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // common tokens that indicate rich/html input
    return /(wysiwyg|html|rich|editor|ckeditor|tinymce)/.test(combined);
  }
}

export default HtmlStripper;
