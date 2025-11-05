declare module "html-docx-js/dist/html-docx" {
  type MarginOptions = {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };

  type ExportOptions = {
    orientation?: "portrait" | "landscape";
    margins?: MarginOptions;
  };

  export function asBlob(html: string, options?: ExportOptions): Blob;
  export function asArrayBuffer(
    html: string,
    options?: ExportOptions,
  ): ArrayBuffer;
}
