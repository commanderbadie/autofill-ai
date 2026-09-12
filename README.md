# Apex AutoFill

A small Chrome extension to automate copying jumbled product data from the
PDF into the entry form on theapexdatasolution.com.

## Status: V5 — Full Pipeline (Detect → Read → Extract → Fill)

All five stages are wired up now:

- **V1**: reliably finds every field on the form and maps each visible
  label ("Product Name", "Men Style Code", ...) to the input's real
  internal `name` attribute (`fname`, `mname`, ...).
- **V2**: pulls the raw text out of the PDF shown in the left panel,
  fetched directly by URL and parsed locally with pdf.js.
- **V3**: sends that raw jumbled text (plus the list of field labels) to
  OpenRouter (free models), which returns a clean, structured value for
  each field.
- **V4**: matches each returned value back to its exact input box (this
  was mostly free — the AI response is already keyed by the same field
  index we detected in V1).
- **V5**: actually types each value into its input box, highlights every
  filled box in yellow, and **stops there** — nothing is ever submitted
  automatically. You review, fix anything wrong, then click "Submit
  Details" yourself.

## Setup: API key (needed for V3 only)

Note: the API key is already hardcoded directly in `background.js` for
this build, so no popup step is required — this section is just for
reference/reinstalling later.

1. Go to [openrouter.ai/keys](https://openrouter.ai/keys) and sign in (no
   card needed for free models).
2. Click **Create Key**, copy it.
3. It's used only in `background.js`, sent only to OpenRouter's API.
4. Note: the free tier is capped at 50 requests/day per account, no cost.
   That's plenty for normal one-task-at-a-time use — it only gets hit
   during heavy back-to-back testing. If you see a 429, just wait for the
   daily reset (roughly midnight UTC) and try again; it isn't a bug.

## How to install (Developer mode)

1. Open Chrome and go to `chrome://extensions`.
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select this `apex-autofill` folder.
5. The extension is now active on any `theapexdatasolution.com` page.

## How to test

1. Open an actual task on Apex (any `.../user/submit?file=...` page with
   the PDF + form layout).
2. Every input box on the form should now have a **green outline** — that
   means the extension found and mapped it.
3. A green **"🤖 N fields detected"** button appears in the bottom-right
   corner. Click it to open a panel listing every field: its visible label
   next to its real `name` attribute.
4. Click the button again to close the panel.
5. Open the browser console (F12 → Console tab) — you'll also see the full
   detected list logged there as `[Apex AutoFill] Detected N fields: ...`.

## What to check / report back

- Does the field **count** match the number of rows actually on the form?
- Are any fields **missing** a green outline (i.e. not detected)?
- Does every **label** in the panel match what you see next to that box on
  the real page?
- The known duplicate label "No. of Colors Available" (mapped to two
  different internal names) — does it show up twice in the panel, in the
  right order?

### Testing V2 (PDF reading)

1. On the same task page, click the blue **"📄 Read PDF"** button
   (stacked above the green fields button, bottom-right).
2. It briefly says "Reading...", then a panel opens showing the extracted
   text, page by page.
3. Compare that extracted text against what you can actually see in the
   PDF viewer on the left. Check for:
   - Missing lines or sections
   - Garbled spacing (pdf.js sometimes runs words together or adds extra
     spaces — this is expected and fine, V3's AI step will clean it up)
   - Whether both pages (if the PDF has 2) came through
4. If the button says "No PDF found" or "Read failed", open the console
   (F12) and send me the error — likely means the `<embed>` structure
   differs from what we saw, or the fetch was blocked.

### Testing V3 (AI extraction)

1. The API key is already hardcoded in `background.js`, so there's
   nothing to save — just click.
2. Click the purple **"🧠 AI Extract"** button (top of the button stack).
   It'll read the PDF first if you haven't already, then call OpenRouter.
3. A panel opens listing every field alongside the value the model pulled
   for it. Compare each one against the PDF — check especially:
   - The duplicate "No. of Colors Available" fields — did it assign them
     different values correctly, or did it just repeat one?
   - Any field showing "(none found)" — is that actually missing from the
     PDF, or did it just miss it?
   - Any value that looks subtly wrong (extra punctuation, truncated,
     merged with a neighboring value)
4. If it fails, the alert message should say why (missing key, rate
   limit, bad JSON from the model) — send me that message if unclear.

### Testing V4/V5 (fill the form)

1. After AI Extract finishes successfully, a fourth button appears:
   yellow **"✍️ Fill Form"**.
2. Click it. Every field with a found value gets typed in and outlined in
   **yellow** (distinct from the green "detected" outline) — this tells
   you at a glance which boxes the extension just touched.
3. **Check every yellow field against the PDF before doing anything
   else.** Known things to double check:
   - Any stray extra spaces inside a word (a pdf.js text-extraction
     quirk, e.g. "P ink" instead of "Pink") — fix by hand if you spot it.
   - Fields left blank — these had no value found; check whether that's
     actually correct or the AI missed something in the PDF.
   - The two duplicate "No. of Colors Available" boxes — should both be
     filled with the same value if the PDF only states it once.
4. Only once everything looks right, click **"Submit Details"** yourself.
   The extension will never do this step for you.

## Roadmap

- [x] V1 — Detect the form and map label → field name
- [x] V2 — Read the PDF currently displayed
- [x] V3 — AI extraction of the jumbled PDF text into structured data
- [x] V4 — Automatic matching of extracted data to detected fields
- [x] V5 — One-click autofill, stopping for manual verification before submit

## Ideas for later (not built yet)

- Clean up pdf.js text-extraction artifacts (stray mid-word spaces)
  before filling, instead of leaving them for manual fixing.
- A "clear all filled fields" button in case a fill run needs a redo.
- Remembering which task numbers have already been processed.
