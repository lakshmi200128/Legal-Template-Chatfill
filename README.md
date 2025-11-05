## Legal Template Chatfill

Legal Template Chatfill is a Next.js web app that helps teams turn legal templates into completed agreements through a conversational workflow. Upload a `.docx` draft, review the detected placeholders, answer guided prompts, and download a finished version of the document.

### Highlights
- **DOCX ingest:** Upload Microsoft Word templates up to 8 MB. The service extracts text with [`mammoth`](https://github.com/mwilliamson/mammoth.js) and looks for common placeholder patterns (`[]`, `<>`, `{{}}`, etc.).
- **Guided chat:** The assistant walks through each detected placeholder, tracks your answers, and lets you jump back to revise any field.
- **Live preview & export:** Watch values appear in the document preview (highlighted for clarity) and download the completed agreement as a `.docx` file generated with `html-docx-js`.
- **Fast front end:** Built with the Next.js App Router, TypeScript, and Tailwind CSS (v4) for a responsive, single-page experience.

### Project Structure
```
src/
  app/
    api/
      upload/route.ts     # DOCX upload + placeholder extraction endpoint
    layout.tsx            # Global layout & metadata
    page.tsx              # Main UI and conversational flow
  lib/
    placeholders.ts       # Placeholder detection helpers
```

### Local Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) and upload a `.docx` template to get started.

> **Heads up:** The current sandbox blocked `next build` because Turbopack tries to bind a local port. On a regular machine the build should succeed, but if you hit the same issue set `NEXT_DISABLE_TURBO=1` before running the build to force the legacy Webpack pipeline.

### Detected Placeholder Patterns
The extractor scans the document text for:
- `{{ Placeholder }}`
- `[[ Placeholder ]]`
- `<< Placeholder >>`
- `<Placeholder>`
- `[Placeholder]`
- `__Placeholder__`
- `**Placeholder**`

Placeholders are deduplicated case-insensitively and normalized into friendly labels/questions. Additional patterns can be added in `src/lib/placeholders.ts`.

### Deploying
The app is ready for Vercel:
1. Push the repo to GitHub.
2. Create a new Vercel project, import the repository, and select the default settings.
3. Set `NEXT_DISABLE_TURBO=1` in the project environment variables if your build environment restricts port binding.
4. Deploy—Vercel will provide a public URL suitable for sharing in the application email.

### Testing Checklist
- `npm run lint`
- `npm run build` (may require the turbopack note above)
- Manual smoke test: upload the provided SAFE template, confirm placeholders populate, finish the chat, and download the completed document.

### Future Enhancements
- Persist sessions and allow multiple collaborators.
- Support additional file types (PDF via OCR + heuristics).
- Integrate with knowledge bases (e.g., company directory) to pre-fill common answers.
- Use NLP to auto-generate more contextual follow-up questions per placeholder.
