import { NextResponse } from "next/server";
import mammoth from "mammoth";

import { extractPlaceholders } from "@/lib/placeholders";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB guardrail

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "A valid .docx file is required." },
        { status: 400 },
      );
    }

    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json(
        { message: "Only .docx files are supported right now." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          message: "File is too large. Please upload a document smaller than 8 MB.",
        },
        { status: 413 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const [{ value: html }, { value: text }] = await Promise.all([
      mammoth.convertToHtml({ buffer }),
      mammoth.extractRawText({ buffer }),
    ]);

    const placeholders = extractPlaceholders(text);

    return NextResponse.json({
      fileName: file.name,
      html,
      placeholders,
    });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json(
      {
        message:
          "We were unable to process that document. Please ensure it's a valid .docx template.",
      },
      { status: 500 },
    );
  }
}
