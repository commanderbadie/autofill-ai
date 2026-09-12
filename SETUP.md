# Autofill AI — Setup Guide

This guide explains how to install and configure **Autofill AI** in Google Chrome.

---

## 1. Download the Project

On the GitHub repository page:

**Code → Download ZIP**

Extract the downloaded ZIP file.

You should have a folder containing:

```text
autofill/
├── background.js
├── content.js
├── manifest.json
├── popup.html
├── popup.js
├── README.md
├── SETUP.md
├── styles.css
└── vendor/
    ├── pdf.min.js
    └── pdf.worker.min.js
```

> Make sure `manifest.json` is directly inside the folder you select during installation.

---

## 2. Open Chrome Extensions

Open Google Chrome and go to:

```text
chrome://extensions/
```

Enable:

**Developer mode**

in the top-right corner.

---

## 3. Load Autofill AI

Click:

**Load unpacked**

Select the extracted **`autofill`** folder.

Chrome should now display **Autofill AI** in your extensions list.

---

## 4. Create an OpenRouter API Key

Autofill AI uses OpenRouter to process PDF information with an AI model.

Go to:

https://openrouter.ai/

Create an account or sign in.

Then open:

https://openrouter.ai/keys

Create a new API key and copy it.

> Never publish your API key or commit it to GitHub.

---

## 5. Add Your API Key

Click the Chrome **Extensions** icon.

Open **Autofill AI**.

Enter your OpenRouter API key in the:

**OpenRouter API Key**

field.

Click:

**Save**

You should see:

```text
Saved.
```

The API key is stored locally using Chrome extension storage.

---

## 6. Use Autofill AI

Once the extension is installed and configured:

1. Open the PDF containing the product information.
2. Open the target web form.
3. Open the Autofill AI extension.
4. Start the autofill process.
5. Autofill AI reads the PDF.
6. The AI extracts and structures the information.
7. The extension matches the information to the form fields.
8. The matching fields are automatically filled.
9. Review the filled fields.
10. Correct anything that needs to be changed.
11. Submit the form manually.

### Important

**Autofill AI never automatically submits the form.**

Always review AI-generated information before submitting.

---

# Troubleshooting

## API Key Error

If you see:

```text
AI extraction failed: No OpenRouter API key found. Open the Autofill AI popup and enter your API key.
```

Open the Autofill AI popup and enter your API key again.

Click **Save** and make sure you see:

```text
Saved.
```

Then go to:

```text
chrome://extensions/
```

Find **Autofill AI** and click **Reload**.

Try the process again.

---

## Extension Does Not Load

Make sure:

- You extracted the ZIP file.
- You selected the extracted folder.
- The selected folder contains `manifest.json`.
- Chrome Developer mode is enabled.

---

## Changes Are Not Showing

After modifying the extension files:

1. Open `chrome://extensions/`
2. Find **Autofill AI**
3. Click **Reload**

Then refresh the target webpage.

---

## AI Extraction Fails

Check:

- Your OpenRouter API key is correct.
- Your OpenRouter account has API access.
- You have an active internet connection.
- The PDF contains the required information.
- The target form is open correctly.

---

## Security

Never put your OpenRouter API key directly into:

```text
background.js
```

or any other source file.

Do not commit an API key to GitHub.

Autofill AI is designed so that each user provides their own API key through the extension popup.

If an API key is accidentally exposed, revoke it immediately and create a new one.

---

## Quick Setup

```text
Download ZIP
     ↓
Extract ZIP
     ↓
chrome://extensions/
     ↓
Enable Developer Mode
     ↓
Load unpacked
     ↓
Select autofill folder
     ↓
Open Autofill AI
     ↓
Enter OpenRouter API key
     ↓
Click Save
     ↓
Open PDF + target form
     ↓
Run Autofill AI
     ↓
Review filled fields
     ↓
Submit manually
```