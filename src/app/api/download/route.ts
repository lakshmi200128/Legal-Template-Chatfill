import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import HtmlToDocx from "@turbodocx/html-to-docx";

export const runtime = "nodejs";

const wrapHtmlForDocx = (content: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${content}</body></html>`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, fileName } = body;

    if (!html || typeof html !== "string") {
      return NextResponse.json(
        { message: "HTML content is required." },
        { status: 400 },
      );
    }

    if (!fileName || typeof fileName !== "string") {
      return NextResponse.json(
        { message: "File name is required." },
        { status: 400 },
      );
    }

    const wrappedHtml = wrapHtmlForDocx(html);
    
    // Generate the document using html-to-docx (server-side library)
    const buffer = await HtmlToDocx(wrappedHtml);

    if (!buffer || buffer.length === 0) {
      throw new Error("Generated buffer is empty");
    }

    const friendlyName = fileName.replace(/\.docx$/i, "-completed.docx");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(friendlyName)}"`,
      },
    });
  } catch (error) {
    console.error("Download generation error:", error);
    console.error("Error details:", error instanceof Error ? error.stack : error);
    return NextResponse.json(
      {
        message:
          error instanceof Error 
            ? `Failed to generate document: ${error.message}`
            : "We couldn't generate the download. Please try again.",
      },
      { status: 500 },
    );
  }
}
