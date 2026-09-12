// OpenRouter — "openrouter/free" auto-selects a working free model under
// the hood. Free tier: 50 requests/day per account with no cost and no
// card required. That daily cap resets every 24h (roughly midnight UTC).
const MODEL = "openrouter/free";
const API_URL = "https://openrouter.ai/api/v1/chat/completions";


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "apex-autofill-parse-pdf") return false;

  handleParseRequest(message.pdfPages, message.fieldLabels)
    .then((result) => sendResponse({ ok: true, data: result }))
    .catch((err) =>
      sendResponse({ ok: false, error: err.message || String(err) })
    );

  return true; // keep the message channel open for the async response
});

async function handleParseRequest(pdfPages, fieldLabels) {
    const { openrouterApiKey } = await chrome.storage.local.get("openrouterApiKey");

  if (!openrouterApiKey) {
    throw new Error(
      "No OpenRouter API key found. Open the APEX Autofill popup and enter your API key."
    );
  }
  const prompt = buildPrompt(pdfPages, fieldLabels);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${openrouterApiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    if (response.status === 429) {
      throw new Error(
        "Daily free-tier limit hit again (50 requests/day, no cost). Just wait for the reset and try later — this isn't a bug."
      );
    }
    throw new Error(`OpenRouter API error ${response.status}: ${bodyText.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("OpenRouter returned no text content.");
  }

  return parseModelJson(text);
}

function buildPrompt(pdfPages, fieldLabels) {
  const pdfText = pdfPages
    .map((text, i) => `--- PDF Page ${i + 1} ---\n${text}`)
    .join("\n\n");

  const fieldList = fieldLabels
    .map((f, i) => `${i}. "${f.label}"`)
    .join("\n");

  return `You are extracting structured product data from a jumbled block of PDF text and matching it to a known list of form field labels.

PDF TEXT (raw, run-together, may have odd spacing):
${pdfText}

FORM FIELDS TO FILL (index. label):
${fieldList}

Instructions:
- For each numbered field above, find the matching value in the PDF text.
- If a label appears more than once in the field list (same wording, different index), use context/order in the PDF text to assign each occurrence to a different field index — do not just repeat the same value for every duplicate unless the PDF text truly repeats it too.
- If no matching value can be found for a field, use an empty string "".
- Do not invent values that are not present in the PDF text.

Respond with ONLY a JSON array, no other text, no markdown code fences. Each element:
{"index": <number>, "label": "<label as given>", "value": "<extracted value or empty string>"}

The array must have exactly ${fieldLabels.length} elements, one per field index above, in order.`;
}

function parseModelJson(rawText) {
  const cleaned = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  // Models on the free tier sometimes append extra text after the JSON
  // array (a stray comment, a duplicated response, etc.). Rather than
  // trusting the whole string is valid JSON, pull out just the first
  // complete top-level [...] block by matching brackets.
  const jsonSlice = extractFirstJsonArray(cleaned) || cleaned;

  let parsed;
  try {
    parsed = JSON.parse(jsonSlice);
  } catch (err) {
    throw new Error(
      `Could not parse the model's response as JSON: ${err.message}. Raw response: ${cleaned.slice(0, 200)}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Model's response was valid JSON but not an array.");
  }

  return parsed;
}

function extractFirstJsonArray(text) {
  const start = text.indexOf("[");
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "[") depth++;
    else if (text[i] === "]") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null; // never closed — truncated response, let JSON.parse report it
}
