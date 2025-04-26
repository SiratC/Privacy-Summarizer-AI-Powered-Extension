console.log("Content script loaded on", window.location.href);

const excludedDomains = ["www.google.com", "www.bing.com"];


  const keywords = ["privacy", "cookies", "policy", "terms", "legal"];

  // search a link with keyword in href or text
  function findKeywordLink() {
    return Array.from(document.querySelectorAll("a[href]")).find(a => {
      const href = a.href.toLowerCase();
      const text = (a.textContent || "").toLowerCase();
      return keywords.some(k => href.includes(k) || text.includes(k));
    });
  }

  // find any element containing a keyword
  function findElementWithKeyword() {
    return Array.from(document.querySelectorAll("*")).find(el => {
      const txt = (el.textContent || "").toLowerCase();
      return keywords.some(k => txt.includes(k));
    });
  }

  // main detection logic
  function attemptLinkDetection() {
    let link = findKeywordLink();
    if (link) {
      console.log("Found link:", link.href);
      chrome.runtime.sendMessage({ action: "fetchAndSummarize", url: link.href });
    } else {
      const observer = new MutationObserver(() => {
        link = findKeywordLink();
        if (link) {
          observer.disconnect();
          clearTimeout(timeout);
          chrome.runtime.sendMessage({ action: "fetchAndSummarize", url: link.href });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      const timeout = setTimeout(() => {
        observer.disconnect();
        const el = findElementWithKeyword();
        if (el) showElementTextFoundPopup();
        else showNoLinkFoundPopup();
      }, 5000);
    }
  }

  // listen for toolbar click and summary display
  chrome.runtime.onMessage.addListener(message => {
    if (message.action === "startSummarize") {
      attemptLinkDetection();
    } else if (message.action === "display") {
      showSummaryPopup(message.summary);
    }
  });

  // shadow DOM isolated summary popup
  function showSummaryPopup(summary) {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = `
      .popup { all: initial; position: fixed; top:50%; right:10px; transform: translateY(-50%);
        width:320px; padding:16px; background:#002B36; color:#EEE8D5;
        border:2px solid #586E75; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3);
        font-family:sans-serif; line-height:1.4; z-index:2147483647; }
      .popup h4 { margin:0 0 8px; font-size:16px; }
      .popup p { margin:0 0 12px; font-size:14px; }
      .popup button { all: initial; cursor:pointer; padding:6px 12px; background:#586E75;
        color:#FDF6E3; border-radius:4px; font-size:13px; display:inline-block; }
      .popup button:hover { background:#657B83; }
    `;
    shadow.appendChild(style);
    const container = document.createElement("div");
    container.classList.add("popup");
    container.innerHTML = `
      <h4>Privacy Terms Summarized:</h4>
      <p>${summary}</p>
      <button>Close</button>
    `;
    shadow.appendChild(container);
    container.querySelector("button").addEventListener("click", () => host.remove());
  }

  // fallback 
  function showElementTextFoundPopup() {
    alert("Privacy-related text found but no link. Please navigate to the privacy page and click the extension icon again.");
  }

  function showNoLinkFoundPopup() {
    alert("No privacy or terms link detected. Please navigate to the privacy page and click the extension icon again.");
  }
