'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import { isDateLabel, type Placeholder } from "@/lib/placeholders";

type Message = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type UploadResponse = {
  fileName: string;
  html: string;
  placeholders: Placeholder[];
};

type ConversationState = "idle" | "chatting" | "complete";

const messageId = (() => {
  let count = 0;
  return (role: Message["role"]) => `${role}-${++count}`;
})();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const applyPreviewHtml = (
  html: string,
  placeholders: Placeholder[],
  answers: Record<string, string>,
  activeId: string | null,
) =>
  placeholders.reduce((updated, placeholder) => {
    const answer = answers[placeholder.id];
    const stateClass = answer ? "is-filled" : "is-pending";
    const classes = ["filled-value", stateClass];
    if (placeholder.id === activeId) {
      classes.push("is-active");
    }

    const display = answer
      ? escapeHtml(answer).replace(/\n/g, "<br />")
      : escapeHtml(placeholder.raw);

    const attributes = [
      `class="${classes.join(" ")}"`,
      `data-placeholder-id="${placeholder.id}"`,
      `data-state="${answer ? "filled" : "pending"}"`,
    ];

    if (placeholder.id === activeId) {
      attributes.push(`title="Currently editing"`);
    }

    const replacement = `<mark ${attributes.join(" ")}>${display}</mark>`;

    return updated.split(placeholder.raw).join(replacement);
  }, html);

const applyDownloadHtml = (
  html: string,
  placeholders: Placeholder[],
  answers: Record<string, string>,
) =>
  placeholders.reduce((updated, placeholder) => {
    const answer = answers[placeholder.id];
    if (!answer) {
      return updated;
    }

    const escaped = escapeHtml(answer).replace(/\n/g, "<br />");
    return updated.split(placeholder.raw).join(escaped);
  }, html);

const triggerDownload = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentData, setDocumentData] = useState<UploadResponse | null>(null);
  const [placeholders, setPlaceholders] = useState<Placeholder[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      id: messageId("assistant"),
      role: "assistant",
      text: "Upload a legal template (.docx) and I'll help you fill in the blanks.",
    },
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [state, setState] = useState<ConversationState>("idle");
  const [downloadPending, setDownloadPending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const currentPlaceholder = placeholders[currentIndex] ?? null;

  const previewHtml = useMemo(() => {
    if (!documentData) {
      return "";
    }

    if (Object.keys(answers).length === 0) {
      return documentData.html;
    }

    return applyPreviewHtml(
      documentData.html,
      placeholders,
      answers,
      currentPlaceholder?.id ?? null,
    );
  }, [documentData, placeholders, answers, currentPlaceholder]);

  const downloadHtml = useMemo(() => {
    if (!documentData) {
      return "";
    }

    return applyDownloadHtml(documentData.html, placeholders, answers);
  }, [documentData, placeholders, answers]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      let payload: UploadResponse | { message?: string } | null = null;

      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok || !payload || !("html" in payload)) {
        const message =
          (payload && "message" in payload && payload.message) ||
          "We couldn't process that document. Please try another template.";
        throw new Error(message);
      }

      const data = payload as UploadResponse;

      setDocumentData(data);
      setPlaceholders(data.placeholders);
      setAnswers({});
      setCurrentIndex(0);
      setState(
        data.placeholders.length > 0 ? "chatting" : "complete",
      );

      const introMessage: Message = {
        id: messageId("assistant"),
        role: "assistant",
        text:
          data.placeholders.length > 0
            ? `I found ${data.placeholders.length} placeholder${
                data.placeholders.length === 1 ? "" : "s"
              }. Let's fill them in together.`
            : "I didn't detect any placeholders, but you can still review the document below.",
      };

      if (data.placeholders.length > 0) {
        const firstQuestion: Message = {
          id: messageId("assistant"),
          role: "assistant",
          text: data.placeholders[0].question,
        };
        setMessages([introMessage, firstQuestion]);
      } else {
        setMessages([introMessage]);
      }

      setInputValue("");
    } catch (uploadError) {
        const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Please try again.";
      setError(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    handleUpload(file);
  };

  const submitAnswer = () => {
    setError(null);

    const trimmed = inputValue.trim();
    if (!trimmed || !currentPlaceholder) {
      return false;
    }

    const requiresDate =
      currentPlaceholder && isDateLabel(currentPlaceholder.label);

    if (requiresDate && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      setError("Dates must use the YYYY-MM-DD format (e.g., 2024-03-31).");
      return false;
    }

    setMessages((prev) => [
      ...prev,
      { id: messageId("user"), role: "user", text: trimmed },
    ]);

    setAnswers((prev) => ({
      ...prev,
      [currentPlaceholder.id]: trimmed,
    }));

    const nextIndex = currentIndex + 1;

    if (nextIndex < placeholders.length) {
      const nextPlaceholder = placeholders[nextIndex];
      setMessages((prev) => [
        ...prev,
        {
          id: messageId("assistant"),
          role: "assistant",
          text: nextPlaceholder.question,
        },
      ]);
      setCurrentIndex(nextIndex);
      setInputValue("");
      setState("chatting");
      return true;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: messageId("assistant"),
        role: "assistant",
        text: "All set! You can review the completed document on the right. Feel free to adjust any field from the list below.",
      },
    ]);
    setState("complete");
    setInputValue("");
    return true;
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    submitAnswer();
  };

  const handlePlaceholderSelect = (index: number) => {
    if (!placeholders[index]) {
      return;
    }

    setError(null);
    const placeholder = placeholders[index];

    setMessages((prev) => [
      ...prev,
      {
        id: messageId("assistant"),
        role: "assistant",
        text: `Let's update the ${placeholder.label.toLowerCase()}. ${placeholder.question}`,
      },
    ]);

    setCurrentIndex(index);
    setState("chatting");
    setInputValue(answers[placeholder.id] ?? "");
  };

  const handleDownload = async () => {
    if (!documentData) {
      return;
    }

    try {
      setError(null);
      setDownloadPending(true);
      const friendlyName = documentData.fileName.replace(
        /\.docx$/i,
        "-completed.docx",
      );
      const finalHtml = downloadHtml || documentData.html;

      const response = await fetch("/api/download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: finalHtml,
          fileName: documentData.fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "Failed to generate download file.",
        );
      }

      const blob = await response.blob();
      triggerDownload(blob, friendlyName);
    } catch (downloadError) {
      console.error("Download error", downloadError);
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "We couldn't generate the download. Please try again.",
      );
    } finally {
      setDownloadPending(false);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    });
  }, [messages]);

  useEffect(() => {
    if (!currentPlaceholder || !previewContainerRef.current) {
      return;
    }

    const container = previewContainerRef.current;
    const target = container.querySelector<HTMLElement>(
      `[data-placeholder-id="${currentPlaceholder.id}"]`,
    );

    if (target) {
      const containerRect = container.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const offsetMargin = 24;
      const isAbove = targetRect.top < containerRect.top + offsetMargin;
      const isBelow = targetRect.bottom > containerRect.bottom - offsetMargin;

      if (isAbove || isBelow) {
        target.scrollIntoView({
          behavior: "smooth",
          block: isAbove ? "start" : "end",
        });
      }
    }
  }, [currentPlaceholder, previewHtml]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 lg:px-0 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
              Legal Template Chatfill
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-slate-900 sm:text-4xl">
              Complete legal templates with a conversation.
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">
              Upload your SAFE or other Word template, answer conversational prompts, and download a polished, filled-in version in minutes.
            </p>
          </div>
          <div className="hidden items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 shadow-sm sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
            <span>Everything stays on this device. No uploads to a server.</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-0">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px),1fr]">
          <section className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Upload your template
                  </h2>
                  <p className="text-xs text-slate-500">
                    Supports .docx files up to 8&nbsp;MB.
                  </p>
                </div>
                {documentData ? (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    Loaded
                  </span>
                ) : null}
              </div>

              <label
                htmlFor="template-upload"
                className="mt-5 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-9 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                <input
                  ref={fileInputRef}
                  id="template-upload"
                  type="file"
                  accept=".docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="rounded-full bg-emerald-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  {isUploading ? "Uploading…" : documentData ? "Replace file" : "Upload .docx"}
                </span>
                <div className="text-sm text-slate-600">
                  {isUploading
                    ? "Processing your document…"
                    : documentData
                      ? "Upload a different template to start over."
                      : "Click to select a file or drag it here."}
                </div>
                <p className="text-[11px] text-slate-400">
                  No data leaves your browser • Supported format: .docx
                </p>
              </label>

              {!documentData && error ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {error}
                </p>
              ) : null}

              {documentData ? (
                <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                  <div>
                    <p className="font-semibold text-slate-800">Current file</p>
                    <p className="mt-1 line-clamp-2 text-slate-600">
                      {documentData.fileName}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500">
                    {placeholders.length} placeholders
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex max-h-[420px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Chat through the blanks
                  </h2>
                  <p className="text-xs text-slate-500">
                    The assistant guides you one placeholder at a time.
                  </p>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {state === "complete"
                    ? "Complete"
                    : state === "chatting"
                      ? currentPlaceholder?.label ?? "Respond"
                      : "Awaiting upload"}
                </span>
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
              >
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "assistant"
                        ? "justify-start"
                        : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        message.role === "assistant"
                          ? "rounded-tl-md border border-slate-200 bg-slate-50 text-slate-700"
                          : "rounded-tr-md bg-emerald-500 text-emerald-950"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleFormSubmit}
                className="border-t border-slate-200 bg-slate-50 px-6 py-5"
              >
                <div className="flex gap-3">
                  <textarea
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        submitAnswer();
                      }
                    }}
                    placeholder={
                      !documentData
                        ? "Upload a template to begin…"
                        : state === "complete"
                          ? placeholders.length === 0
                            ? "No detected placeholders for this document."
                            : "Select a field to revise it…"
                          : currentPlaceholder
                            ? `Answer for ${currentPlaceholder.label.toLowerCase()}`
                            : "Waiting for the next question…"
                    }
                    disabled={
                      !documentData || state === "idle" || placeholders.length === 0
                    }
                    className="min-h-[110px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={
                      !documentData ||
                      state === "idle" ||
                      !inputValue.trim() ||
                      placeholders.length === 0
                    }
                    className="inline-flex h-[110px] min-w-[110px] items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                  >
                    {state === "complete" ? "Update" : "Send"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Press Enter to send • Shift+Enter for a new line
                </p>

                {documentData && error ? (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                    {error}
                  </p>
                ) : null}
              </form>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">
                  Placeholder checklist
                </h3>
                <span className="text-xs text-slate-500">
                  {placeholders.length} total
                </span>
              </div>

              <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                {placeholders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Upload a template to see detected placeholders here.
                  </p>
                ) : (
                  placeholders.map((placeholder, index) => {
                    const filled = answers[placeholder.id];
                    const isActive = index === currentIndex;

                    return (
                      <button
                        key={placeholder.id}
                        type="button"
                        onClick={() => handlePlaceholderSelect(index)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                          isActive
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/70"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {placeholder.label}
                          </span>
                          <span className="mt-1 text-xs text-slate-500">
                            {filled ? filled : placeholder.raw}
                          </span>
                        </div>
                        <span
                          className={`ml-4 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                            filled
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                          aria-hidden="true"
                        >
                          {filled ? "✓" : index + 1}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </section>

          <section className="flex min-h-[680px] flex-col rounded-3xl border border-slate-200 bg-white shadow-md">
            <div className="flex flex-col gap-3 border-b border-slate-200 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Preview & export
                </h2>
                <p className="text-xs text-slate-500">
                  Filled placeholders are highlighted so you can track your progress.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownload}
                disabled={!documentData || downloadPending}
                className="inline-flex items-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {downloadPending ? "Preparing…" : "Download .docx"}
              </button>
            </div>

            <div
              ref={previewContainerRef}
              className="document-preview prose-scrollbar relative flex-1 overflow-y-auto px-8 py-8 text-sm leading-relaxed text-slate-700"
            >
              {!documentData ? (
                <div className="flex h-full items-center justify-center text-center text-slate-400">
                  Upload a template to preview the document as you fill it in.
                </div>
              ) : (
                <article
                  className="space-y-4"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              )}
            </div>

            {documentData && error && !placeholders.length ? (
              <div className="border-t border-slate-200 bg-rose-50 px-8 py-4 text-sm text-rose-600">
                {error}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
