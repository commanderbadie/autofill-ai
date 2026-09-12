document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById("apiKey");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("status");

  const stored = await chrome.storage.local.get("openrouterApiKey");
  if (stored.openrouterApiKey) {
    input.value = stored.openrouterApiKey;
  }

  saveBtn.addEventListener("click", async () => {
    const key = input.value.trim();
    if (!key) {
      showStatus("Enter a key first.", false);
      return;
    }
    await chrome.storage.local.set({ openrouterApiKey: key });
    showStatus("Saved.", true);
  });

  function showStatus(msg, ok) {
    status.textContent = msg;
    status.className = ok ? "ok" : "err";
    setTimeout(() => {
      status.textContent = "";
      status.className = "";
    }, 2500);
  }
});
