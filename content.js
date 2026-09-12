/**
 * Apex AutoFill — V1: Form Detection + V2: PDF Reading
 *
 * Runs in every frame on the page (all_frames: true in manifest) because
 * the PDF <embed> may sit inside an iframe rather than the top document.
 * Only the top frame builds any UI; child frames just hunt for the PDF
 * embed and report the URL back up via postMessage.
 */

(function () {
  "use strict";

  const IS_TOP = window.top === window;
  const FORM_SELECTOR = 'form[action*="/user/form"]';
  const PDF_MESSAGE_TYPE = "apex-autofill-pdf-url";

  function init() {
    if (IS_TOP) {
      initTopFrame();
    } else {
      initChildFrame();
    }
  }

  // -----------------------------------------------------------------------
  // Top frame: builds all UI (field highlighting, buttons, panels)
  // -----------------------------------------------------------------------

  let lastDetectedFields = [];
  let lastPdfPages = null;

  function initTopFrame() {
    const form = document.querySelector(FORM_SELECTOR);
    if (form) {
      const fields = detectFields(form);
      if (fields.length > 0) {
        console.log(`[Apex AutoFill] Detected ${fields.length} fields:`, fields);
        lastDetectedFields = fields;
        highlightFields(fields);
        injectSummaryButton(fields);
      } else {
        console.warn("[Apex AutoFill] Form found, but no fields detected.");
      }
    }

    // PDF detection: search our own document AND listen for a report from
    // a child iframe, whichever comes first.
    injectPdfButton();

    window.addEventListener("message", (event) => {
      const data = event.data;
      if (!data || data.type !== PDF_MESSAGE_TYPE || !data.url) return;
      console.log("[Apex AutoFill] PDF URL reported from iframe:", data.url);
      onPdfUrlFound(data.url);
    });
  }

  // -----------------------------------------------------------------------
  // Child frame: just hunts for the PDF embed and reports it upward
  // -----------------------------------------------------------------------

  function initChildFrame() {
    let attempts = 0;
    const maxAttempts = 40; // ~20s at 500ms
    const pollId = setInterval(() => {
      attempts++;
      const url = findPdfUrl();
      if (url) {
        clearInterval(pollId);
        window.top.postMessage({ type: PDF_MESSAGE_TYPE, url }, "*");
      } else if (attempts >= maxAttempts) {
        clearInterval(pollId);
      }
    }, 500);
  }

  /**
   * Walk every <tr> inside the form. A field row looks like:
   *   <tr><td>Label Text :</td><td><div class="col-lg"><input name="..." ...></div></td></tr>
   * Rows without both a label and a text input (e.g. the submit-button row,
   * blank spacer rows, hidden-field rows) are skipped.
   *
   * Duplicate labels (e.g. "No. of Colors Available" appears twice) are kept
   * as separate entries, in document order — we do NOT de-duplicate by label,
   * since later versions will need to match against the PDF using position
   * as well as label text.
   */
  function detectFields(form) {
    const fields = [];
    const rows = form.querySelectorAll("tr");

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll("td");
      if (cells.length < 2) return;

      const labelCell = cells[0];
      const inputCell = cells[1];

      const input = inputCell.querySelector(
        'input[type="text"], input:not([type]), textarea'
      );
      if (!input) return;

      // Skip hidden inputs just in case (e.g. musa/khedi/batchid live outside
      // <tr> rows already, but this is a safety net).
      if (input.type === "hidden" || input.hidden) return;

      const label = labelCell.textContent.replace(/\s*:\s*$/, "").trim();
      if (!label) return;

      fields.push({
        rowIndex,
        label,
        name: input.getAttribute("name") || "",
        tabindex: input.getAttribute("tabindex") || "",
        element: input,
      });
    });

    return fields;
  }

  function highlightFields(fields) {
    fields.forEach((field) => {
      field.element.classList.add("apex-autofill-detected");
      field.element.title = `Apex AutoFill detected this as: "${field.label}" (name="${field.name}")`;
    });
  }

  function injectSummaryButton(fields) {
    if (document.getElementById("apex-autofill-btn")) return;

    const btn = document.createElement("button");
    btn.id = "apex-autofill-btn";
    btn.textContent = `🤖 ${fields.length} fields detected`;
    btn.addEventListener("click", () => togglePanel(fields));
    document.body.appendChild(btn);
  }

  function togglePanel(fields) {
    const existing = document.getElementById("apex-autofill-panel");
    if (existing) {
      existing.remove();
      return;
    }

    const panel = document.createElement("div");
    panel.id = "apex-autofill-panel";

    const header = makePanelHeader(panel, "Apex AutoFill — Detected Fields (V1)");
    panel.appendChild(header);

    const list = document.createElement("div");
    list.className = "apex-autofill-panel-list";

    fields.forEach((field, i) => {
      const row = document.createElement("div");
      row.className = "apex-autofill-panel-row";
      row.innerHTML = `<span class="apex-autofill-panel-index">${i + 1}.</span>
        <span class="apex-autofill-panel-label">${escapeHtml(field.label)}</span>
        <span class="apex-autofill-panel-name">name="${escapeHtml(field.name)}"</span>`;
      list.appendChild(row);
    });

    panel.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "apex-autofill-panel-footer";
    footer.textContent =
      "This is V1: detection only. PDF reading + AI matching + autofill come next.";
    panel.appendChild(footer);

    document.body.appendChild(panel);
  }

  // ---------------------------------------------------------------------
  // V2: PDF reading
  // ---------------------------------------------------------------------

  function makePanelHeader(panel, text, extraClass) {
    const header = document.createElement("div");
    header.className = extraClass
      ? `apex-autofill-panel-header ${extraClass}`
      : "apex-autofill-panel-header";

    const title = document.createElement("span");
    title.textContent = text;
    header.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.className = "apex-autofill-panel-close";
    closeBtn.textContent = "×";
    closeBtn.title = "Close";
    closeBtn.addEventListener("click", () => panel.remove());
    header.appendChild(closeBtn);

    return header;
  }

  function findPdfUrl() {
    // The PDF panel is an <iframe> whose src IS the actual PDF file
    // directly (e.g. .../public/files/pdf/1234.pdf#view=fitH). Chrome then
    // renders its native viewer *inside* that iframe — a locked-down guest
    // view no extension can read into — but we don't need to: the src
    // attribute itself already gives us the real file URL.
    const iframe = document.querySelector('iframe[src*=".pdf"]');
    if (iframe && iframe.src) {
      return iframe.src.split("#")[0];
    }

    // Fallback for the case where it's a direct <embed> instead of an
    // iframe (seen on some pages/Chrome versions).
    const embed = document.querySelector(
      'embed[type="application/x-google-chrome-pdf"], embed[original-url]'
    );
    if (embed) {
      const raw = embed.getAttribute("original-url") || embed.getAttribute("src");
      if (raw) return raw.split("#")[0];
    }

    return null;
  }

  let pdfButtonEl = null;
  let pdfPollId = null;

  function injectPdfButton() {
    if (document.getElementById("apex-autofill-pdf-btn")) return;

    const btn = document.createElement("button");
    btn.id = "apex-autofill-pdf-btn";
    btn.textContent = "📄 Looking for PDF...";
    btn.disabled = true;
    document.body.appendChild(btn);
    pdfButtonEl = btn;

    // Check our own (top) document too, in case the embed isn't inside an
    // iframe after all — whichever finds it first wins.
    let attempts = 0;
    const maxAttempts = 40; // ~20s at 500ms
    pdfPollId = setInterval(() => {
      attempts++;
      const url = findPdfUrl();
      if (url) {
        onPdfUrlFound(url);
      } else if (attempts >= maxAttempts) {
        clearInterval(pdfPollId);
        pdfPollId = null;
        if (btn.textContent === "📄 Looking for PDF...") {
          btn.textContent = "📄 No PDF found (retry)";
          btn.disabled = false;
          btn.addEventListener("click", () => {
            const retryUrl = findPdfUrl();
            if (retryUrl) {
              onPdfUrlFound(retryUrl);
            } else {
              console.warn(
                "[Apex AutoFill] Still no PDF URL found, in this frame or any iframe."
              );
            }
          });
        }
      }
    }, 500);
  }

  function onPdfUrlFound(pdfUrl) {
    if (pdfPollId) {
      clearInterval(pdfPollId);
      pdfPollId = null;
    }
    const btn = pdfButtonEl || document.getElementById("apex-autofill-pdf-btn");
    if (!btn) return;
    if (btn.dataset.wired === "1") return; // don't double-wire the click handler
    btn.dataset.wired = "1";

    btn.textContent = "📄 Read PDF";
    btn.disabled = false;
    btn.addEventListener("click", () => handleReadPdf(findPdfUrl() || pdfUrl, btn));

    // Once we have a PDF URL, the AI extract step becomes usable too.
    injectAiButton();
  }

  async function handleReadPdf(pdfUrl, btn) {
    const originalText = btn.textContent;
    btn.textContent = "📄 Reading...";
    btn.disabled = true;

    try {
      const pages = await extractPdfText(pdfUrl);
      console.log("[Apex AutoFill] Extracted PDF text by page:", pages);
      lastPdfPages = pages;
      showPdfPanel(pages);
      btn.textContent = `📄 Read PDF (${pages.length} pg)`;
    } catch (err) {
      console.error("[Apex AutoFill] Failed to read PDF:", err);
      btn.textContent = "📄 Read failed (see console)";
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        if (!btn.textContent.startsWith("📄 Read failed")) {
          btn.textContent = originalText;
        }
      }, 4000);
    }
  }

  async function extractPdfText(pdfUrl) {
    if (!chrome?.runtime?.id) {
      throw new Error(
        "Extension connection lost (this happens after reloading the extension while the page was already open). Refresh this Apex page (F5) and try again."
      );
    }
    if (typeof pdfjsLib === "undefined") {
      throw new Error("pdf.js did not load — check vendor/pdf.min.js path.");
    }
    pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL(
      "vendor/pdf.worker.min.js"
    );

    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch PDF (${response.status})`);
    }
    const arrayBuffer = await response.arrayBuffer();

    const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pages = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      // Join text items with a space; pdf.js splits text into fragments
      // that don't always correspond to visual line breaks.
      const text = content.items.map((item) => item.str).join(" ");
      pages.push(text);
    }

    return pages;
  }

  function showPdfPanel(pages) {
    const existing = document.getElementById("apex-autofill-pdf-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "apex-autofill-pdf-panel";

    const header = makePanelHeader(
      panel,
      `Apex AutoFill — Extracted PDF Text (${pages.length} page${pages.length === 1 ? "" : "s"})`
    );
    panel.appendChild(header);

    const body = document.createElement("div");
    body.className = "apex-autofill-pdf-panel-body";
    pages.forEach((text, i) => {
      const pageBlock = document.createElement("div");
      pageBlock.className = "apex-autofill-pdf-page";
      pageBlock.innerHTML = `<div class="apex-autofill-pdf-page-title">Page ${i + 1}</div><pre>${escapeHtml(text)}</pre>`;
      body.appendChild(pageBlock);
    });
    panel.appendChild(body);

    const footer = document.createElement("div");
    footer.className = "apex-autofill-panel-footer";
    footer.textContent =
      "This is V2: raw extraction only. AI parsing into structured fields comes next.";
    panel.appendChild(footer);

    document.body.appendChild(panel);
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------------------------------------------------------------------
  // V3: AI extraction (jumbled PDF text -> structured label/value pairs)
  // ---------------------------------------------------------------------

  function injectAiButton() {
    if (document.getElementById("apex-autofill-ai-btn")) return;

    const btn = document.createElement("button");
    btn.id = "apex-autofill-ai-btn";
    btn.textContent = "🧠 AI Extract";
    btn.addEventListener("click", () => handleAiExtract(btn));
    document.body.appendChild(btn);
  }

  let lastAiResults = null;

  // Fields known to consistently never appear in these product PDFs
  // (confirmed across multiple different tasks) — default these to "N/A"
  // instead of leaving them blank for review each time. Add more labels
  // here if you spot another field that's *always* empty across tasks,
  // not just this one product.
  const ALWAYS_EMPTY_LABELS = ["Purchase Code"];

  function fillKnownAlwaysEmptyFields(results) {
    results.forEach((r) => {
      const label = (r.label || "").trim();
      if (ALWAYS_EMPTY_LABELS.includes(label) && (!r.value || !r.value.trim())) {
        r.value = "N/A";
      }
    });
    return results;
  }

  /**
   * If two or more fields share the exact same visible label (e.g. the
   * form's two "No. of Colors Available" boxes) and the AI only found a
   * value for one of them, copy that value to the others. This is a
   * deterministic fix for a real inconsistency we saw: the free model
   * sometimes catches a duplicate-label match on one run and misses it
   * on another. No need to rely on the AI getting this right every time
   * when we already know these fields should match.
   */
  function fillDuplicateLabelGaps(results) {
    const byLabel = {};
    results.forEach((r) => {
      const key = (r.label || "").trim();
      if (!byLabel[key]) byLabel[key] = [];
      byLabel[key].push(r);
    });

    Object.values(byLabel).forEach((group) => {
      if (group.length < 2) return;
      const filled = group.find((r) => r.value && r.value.trim());
      if (!filled) return;
      group.forEach((r) => {
        if (!r.value || !r.value.trim()) {
          console.log(
            `[Apex AutoFill] Filling duplicate-label gap for "${r.label}" (index ${r.index}) from index ${filled.index}`
          );
          r.value = filled.value;
        }
      });
    });

    return results;
  }

  async function handleAiExtract(btn) {
    if (!chrome?.runtime?.id) {
      alert(
        "Extension connection lost (this happens after reloading the extension while the page was already open). Refresh this Apex page (F5) and try again."
      );
      return;
    }

    if (lastDetectedFields.length === 0) {
      alert("No fields were detected on this page — nothing to match against.");
      return;
    }

    const originalText = btn.textContent;
    btn.disabled = true;

    try {
      // Make sure we actually have PDF text first — read it now if the
      // user hasn't clicked "Read PDF" yet.
      if (!lastPdfPages) {
        btn.textContent = "🧠 Reading PDF first...";
        const pdfUrl = findPdfUrl();
        if (!pdfUrl) {
          throw new Error("No PDF URL available yet — try again in a moment.");
        }
        lastPdfPages = await extractPdfText(pdfUrl);
      }

      btn.textContent = "🧠 Asking Claude...";

      const fieldLabels = lastDetectedFields.map((f) => ({ label: f.label }));
      const response = await chrome.runtime.sendMessage({
        type: "apex-autofill-parse-pdf",
        pdfPages: lastPdfPages,
        fieldLabels,
      });

      if (!response || !response.ok) {
        throw new Error(response?.error || "Unknown error from background script.");
      }

      console.log("[Apex AutoFill] AI extraction result:", response.data);
      let results = fillDuplicateLabelGaps(response.data);
      results = fillKnownAlwaysEmptyFields(results);
      lastAiResults = results;
      showAiResultsPanel(results);
      injectFillButton();
      btn.textContent = "🧠 AI Extract ✓";
    } catch (err) {
      console.error("[Apex AutoFill] AI extraction failed:", err);
      alert(`AI extraction failed: ${err.message}`);
      btn.textContent = "🧠 AI Extract (failed)";
    } finally {
      btn.disabled = false;
      setTimeout(() => {
        btn.textContent = originalText;
      }, 4000);
    }
  }

  function showAiResultsPanel(results) {
    const existing = document.getElementById("apex-autofill-ai-panel");
    if (existing) existing.remove();

    const panel = document.createElement("div");
    panel.id = "apex-autofill-ai-panel";

    const header = makePanelHeader(
      panel,
      `Apex AutoFill — AI Extracted Values (${results.length})`,
      "apex-autofill-panel-header-purple"
    );
    panel.appendChild(header);

    const list = document.createElement("div");
    list.className = "apex-autofill-panel-list";

    results.forEach((r) => {
      const row = document.createElement("div");
      row.className = "apex-autofill-panel-row apex-autofill-ai-row";
      const isEmpty = !r.value;
      row.innerHTML = `<span class="apex-autofill-panel-index">${r.index + 1}.</span>
        <span class="apex-autofill-panel-label">${escapeHtml(r.label || "")}</span>
        <span class="${isEmpty ? "apex-autofill-ai-value-empty" : "apex-autofill-ai-value"}">${escapeHtml(r.value || "(none found)")}</span>`;
      list.appendChild(row);
    });

    panel.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "apex-autofill-panel-footer";
    footer.textContent =
      "Review these values above, then use the yellow \"Fill Form\" button to type them into the actual boxes — nothing submits automatically.";
    panel.appendChild(footer);

    document.body.appendChild(panel);
  }

  // ---------------------------------------------------------------------
  // V4 + V5: match extracted values to real inputs, type them in, and
  // stop for manual review — never auto-submit.
  // ---------------------------------------------------------------------

  function injectFillButton() {
    if (document.getElementById("apex-autofill-fill-btn")) return;

    const btn = document.createElement("button");
    btn.id = "apex-autofill-fill-btn";
    btn.textContent = "✍️ Fill Form";
    btn.addEventListener("click", () => handleFillForm(btn));
    document.body.appendChild(btn);
  }

  function handleFillForm(btn) {
    if (!lastAiResults || lastAiResults.length === 0) {
      alert("No AI-extracted values available yet — run AI Extract first.");
      return;
    }

    let filledCount = 0;
    let skippedCount = 0;

    lastAiResults.forEach((r) => {
      const field = lastDetectedFields[r.index];
      if (!field || !field.element) return;

      const value = (r.value || "").trim();
      if (!value) {
        skippedCount++;
        return;
      }

      const input = field.element;
      input.value = value;
      // Fire the events a real user's typing would trigger, in case the
      // page has any JS listening for input/change (validation, etc.).
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      input.classList.add("apex-autofill-filled");
      filledCount++;
    });

    console.log(
      `[Apex AutoFill] Filled ${filledCount} fields, skipped ${skippedCount} with no value.`
    );
    btn.textContent = `✍️ Filled ${filledCount} (review before submitting!)`;
    setTimeout(() => {
      btn.textContent = "✍️ Fill Form";
    }, 5000);

    alert(
      `Filled ${filledCount} fields (${skippedCount} left blank — no value found). ` +
        `Yellow-highlighted boxes were just filled. PLEASE review every field before clicking "Submit Details" yourself — nothing was submitted automatically.`
    );
  }

  // The form is server-rendered and present at load, but just in case it's
  // swapped in slightly after DOMContentLoaded, give it one retry.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
