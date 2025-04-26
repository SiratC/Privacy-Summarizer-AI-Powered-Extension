// listen for the extension icon click and fire summarization
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: "startSummarize" });
});

// fetch and summarize messages from content script
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action !== "fetchAndSummarize") return;

  console.log("Requesting summary for:", message.url);

  fetch("https://privacy-seven-lake.vercel.app/api/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: message.url })
  })
    .then(res => {
      if (!res.ok) {
        console.error("Proxy request failed with status", res.status);
        throw new Error(`Proxy returned ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      if (!data.summary) {
        console.error("No `summary` field in proxy response:", data);
        return;
      }

      // send summary back to the content script
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "display",
        summary: data.summary
      });
    })
    .catch(err => console.error("Error in fetchAndSummarize:", err));
});
