# Autofill AI

**Autofill AI** is a Chrome extension that reads product information from a PDF, uses AI to structure the information, and automatically fills the matching fields in a web form.

It is designed to reduce repetitive manual data entry while keeping the user in control — the form is **never submitted automatically**.

---

## What It Does

Autofill AI automates this workflow:

**PDF → AI Extraction → Field Matching → Automatic Form Filling → Manual Review → Submit**

The extension:

* Reads text directly from a PDF
* Uses an AI model through OpenRouter to structure the information
* Detects and maps web form fields
* Matches extracted information to the correct fields
* Automatically fills the matching fields
* Highlights fields that were changed
* Allows the user to review and correct the information
* Never automatically submits the form

---

# Installation

## 1. Download the ZIP

Download the **Autofill AI ZIP file** from this GitHub repository.

After downloading:

1. Find the `.zip` file.
2. Right-click it.
3. Select **Extract All...**
4. Choose where you want to extract it.
5. Click **Extract**.

You should now have a folder similar to:

```text
autofill/
├── background.js
├── content.js
├── manifest.json
├── popup.html
├── popup.js
├── README.md
├── styles.css
└── vendor/
    ├── pdf.min.js
    └── pdf.worker.min.js
```

> **Important:** The folder you select during installation must contain `manifest.json`.

---

# 2. Install Autofill AI in Chrome

Open Google Chrome.

Enter the following in the address bar:

```text
chrome://extensions/
```

Press **Enter**.

### Enable Developer Mode

Turn on **Developer mode** in the top-right corner.

Click:

**Load unpacked**

Select the **`autofill` folder** that you extracted earlier.

Make sure you select the folder containing:

```text
manifest.json
```

Click **Select Folder**.

Autofill AI should now appear in your Chrome extensions.

---

# 3. Add Your OpenRouter API Key

Autofill AI uses an AI model through **OpenRouter** to extract and structure information from the PDF.

You need to provide your **own OpenRouter API key**.

### Create an OpenRouter API Key

1. Go to [OpenRouter](https://openrouter.ai/)
2. Create an account or sign in.
3. Open the [OpenRouter API Keys page](https://openrouter.ai/keys).
4. Create a new API key.
5. Copy the key.

### Add the Key to Autofill AI

1. Click the **Extensions** icon in Chrome.
2. Open **Autofill AI**.
3. Find the **OpenRouter API Key** field.
4. Paste your API key.
5. Click **Save**.

You should see:

**Saved.**

Your API key is stored locally using Chrome extension storage.

**Never share your API key or publish it on GitHub.**

---

# 4. Open Your PDF

Open the PDF containing the product information you need to enter into the form.

You do **not** need to manually copy the information from the PDF.

Autofill AI reads the PDF text automatically.

---

# 5. Open the Web Form

Open the website containing the form you want to fill.

Make sure the target form is open and ready.

You do not need to manually type the product information.

---

# 6. Run Autofill AI

Once your PDF and target form are ready:

1. Open the **Autofill AI** extension.
2. Start the autofill process.
3. Autofill AI reads the PDF.
4. The PDF information is sent to the AI through OpenRouter.
5. The AI extracts and structures the relevant information.
6. Autofill AI matches the information to the form fields.
7. The matching fields are automatically filled.

---

# 7. Review the Filled Form

After Autofill AI finishes, **review the form carefully**.

The fields changed by the extension are highlighted so you can quickly identify them.

Check important information such as:

* Product names
* Product codes
* Descriptions
* Quantities
* Dimensions
* Prices
* Dates
* Other important values

### Important

**Autofill AI does NOT automatically submit the form.**

You remain in control of the final submission.

After checking the information and making any necessary corrections, submit the form manually.

---

# Complete Workflow

```text
Download ZIP
      ↓
Extract ZIP
      ↓
Open Chrome
      ↓
chrome://extensions/
      ↓
Enable Developer Mode
      ↓
Load unpacked
      ↓
Select the autofill folder
      ↓
Open Autofill AI
      ↓
Enter your OpenRouter API key
      ↓
Click Save
      ↓
Open the PDF
      ↓
Open the target web form
      ↓
Run Autofill AI
      ↓
AI extracts the PDF information
      ↓
Fields are matched automatically
      ↓
Form fields are filled
      ↓
Review the highlighted fields
      ↓
Make corrections if necessary
      ↓
Submit the form manually
```

---

# How It Works

Autofill AI was developed in five main stages:

### V1 — Form Detection

Detects the fields available on the web form and maps visible labels to their underlying input names.

### V2 — PDF Reading

Reads the raw text directly from the PDF using PDF.js.

### V3 — AI Extraction

Sends the PDF text and detected field labels to an AI model through OpenRouter.

The AI structures the jumbled PDF information into values corresponding to the detected fields.

### V4 — Field Matching

Matches each extracted value to the correct form field.

### V5 — Automatic Form Filling

Types the extracted values into the corresponding fields and highlights the fields that were changed.

The process stops there so the user can review everything before manually submitting the form.

---

# Troubleshooting

## "No OpenRouter API key found"

If you see:

```text
AI extraction failed: No OpenRouter API key found. Open the Autofill AI popup and enter your API key.
```

Follow these steps:

1. Open the **Autofill AI** popup.
2. Enter your OpenRouter API key.
3. Click **Save**.
4. Make sure you see **Saved.**
5. Go to:

```text
chrome://extensions/
```

6. Find **Autofill AI**.
7. Click **Reload**.
8. Try the autofill process again.

---

## Extension Does Not Appear

Make sure you selected the **extracted folder**, not the ZIP file.

The folder you select must contain:

```text
manifest.json
```

For example:

```text
autofill/
├── manifest.json
├── background.js
├── content.js
└── ...
```

---

## I Changed the Files and the Extension Stopped Working

If you make changes to the extension files, Chrome may need to reload the extension.

Go to:

```text
chrome://extensions/
```

Find **Autofill AI** and click:

**Reload**

Then try again.

---

## AI Extraction Fails

Check that:

* Your OpenRouter API key is entered correctly.
* Your OpenRouter API key is still active.
* You have an internet connection.
* Your OpenRouter account/API access is working.
* The PDF contains the information required by the form.

---

# API Key & Privacy

Autofill AI does **not** include a developer API key in the source code.

Each user provides their own OpenRouter API key through the extension popup.

The key is stored locally using Chrome's extension storage.

**Never commit, upload, or share your API key publicly.**

If you accidentally expose an API key, revoke it and create a new one.

---

# Important

AI extraction may not always be perfect.

Always review the automatically filled information before submitting the form.

Autofill AI is designed to assist with data entry — **the final submission remains under the user's control.**

---

# Requirements

* Google Chrome
* An OpenRouter account
* An OpenRouter API key
* Internet connection
* A PDF containing the required information
* Access to the target web form
