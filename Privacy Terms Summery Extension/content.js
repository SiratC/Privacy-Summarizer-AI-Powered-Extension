//Debug
console.log("Content script loaded on", window.location.href);

//List of domains where not to run this code.
const excludedDomains = ["www.google.com", "www.bing.com"];

if (excludedDomains.includes(window.location.hostname)) { // If the current domain is in the excluded list, then do nothing.
 
  //Debug
  console.log("Domain excluded from privacy checks:", window.location.hostname);
} else {// Else, begin the fuction
  
  if (window.top === window) {

    // Keywords to look anywhere in link href or text
    const keywords = ["privacy", "cookies", "policy", "terms", "legal"];
    
    // Function to find a link whose href or text has the keywords
    function findKeywordLink() {
      return Array.from(document.querySelectorAll("a[href]")).find((a) => {
        const lowerHref = a.href.toLowerCase();
        const lowerText = a.textContent.toLowerCase();
        return keywords.some((word) => lowerHref.includes(word) || lowerText.includes(word));
      });
    }

    // Function to check ALL elements for text containing the keywords
    // This might catch a "Privacy Policy" button or some JS-based element
    function findElementWithKeyword() {
      return Array.from(document.querySelectorAll("*")).find((el) => {
        const txt = el.textContent.toLowerCase();
        return keywords.some((word) => txt.includes(word));
      });
    }

    window.addEventListener("load", () => {
      let linkFound = false;

      function attemptLinkDetection() {
        const link = findKeywordLink();
        if (link) {
          linkFound = true;
          console.log("Found link with keyword:", link.href);

          // Send the link's URL to the background script for fetching & summarizing
          chrome.runtime.sendMessage({
            action: "fetchAndSummarize",
            url: link.href,
          });
        } else {
          console.log("No link found yet with keywords:", keywords);
        }
      }

      // Try after load right away
      attemptLinkDetection();

      // For late added ones
      const observer = new MutationObserver(() => {
        if (!linkFound) {
          attemptLinkDetection();
          if (linkFound) {
            observer.disconnect();
            clearTimeout(fallbackTimeout);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // If still no link found after 5sec, then check for any element with keywords
      const fallbackTimeout = setTimeout(() => {
        if (!linkFound) {
          console.log("No link found after 5s. Checking all elements for keywords...");
          observer.disconnect();

          const elementMatch = findElementWithKeyword();
          if (elementMatch) {
            console.log("Found an element with privacy-related text, but no direct link to fetch:", elementMatch);
            // Display a popup telling the user that the keywords were found but no link
            showElementTextFoundPopup();
          } else {
            // If nothing was found, display fallback
            showNoLinkFoundPopup();
          }
        }
      }, 5000);
    });

    // Listen for background script to return the summary
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "display") {
        showSummaryPopup(message.summary);
      }
    });

// Creates the summary popup if found
function showSummaryPopup(summary) {
    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.top = "50%";                // halfway down the screen
    popup.style.right = "10px";             // 10px from the right edge
    popup.style.transform = "translateY(-50%)"; // shift up by 50% of its height
  
    popup.style.width = "300px";
    popup.style.padding = "15px";
    popup.style.background = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.zIndex = "10000";
    popup.style.borderRadius = "8px";
    popup.style.wordWrap = "break-word";
  
    popup.innerHTML = `<strong>Privacy Terms Summarized:</strong><p>${summary}</p>`;
  
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.marginTop = "10px";
    closeButton.style.padding = "5px 10px";
    closeButton.style.border = "none";
    closeButton.style.background = "#00cca3";
    closeButton.style.color = "white";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => popup.remove());
  
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
  }
  
  // Shows a popup if keywords were found but no direct link
  function showElementTextFoundPopup() {
    const popup = document.createElement("div");
    popup.style.position = "fixed";

    popup.style.top = "50%";                // halfway down the screen
    popup.style.right = "10px";             // 10px from the right edge
    popup.style.transform = "translateY(-50%)"; // shift up by 50% of its height
  
    popup.style.width = "300px";
    popup.style.padding = "15px";
    popup.style.background = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.zIndex = "10000";
    popup.style.borderRadius = "8px";
    popup.style.wordWrap = "break-word";
  
    popup.innerHTML = `<p>We detected privacy-related keywords, but there's no direct link to summarize. You may need to navigate to the privacy page manually and reload there for a summary.</p>`;
  
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.marginTop = "10px";
    closeButton.style.padding = "5px 10px";
    closeButton.style.border = "none";
    closeButton.style.background = "#00cca3";
    closeButton.style.color = "white";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => popup.remove());
  
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
  }
  
  // Fallback if no link or text found
  function showNoLinkFoundPopup() {
    const popup = document.createElement("div");
    popup.style.position = "fixed";

    popup.style.top = "50%";                // halfway down the screen
    popup.style.right = "10px";             // 10px from the right edge
    popup.style.transform = "translateY(-50%)"; // shift up by 50% of its height
  
    popup.style.width = "300px";
    popup.style.padding = "15px";
    popup.style.background = "white";
    popup.style.border = "1px solid #ccc";
    popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
    popup.style.zIndex = "10000";
    popup.style.borderRadius = "8px";
    popup.style.wordWrap = "break-word";
  
    popup.innerHTML = `<p>Please click the privacy page if you want a summary on what data are being collected from this site.</p>`;
  
    const closeButton = document.createElement("button");
    closeButton.innerText = "Close";
    closeButton.style.marginTop = "10px";
    closeButton.style.padding = "5px 10px";
    closeButton.style.border = "none";
    closeButton.style.background = "#00cca3";
    closeButton.style.color = "white";
    closeButton.style.borderRadius = "4px";
    closeButton.style.cursor = "pointer";
    closeButton.addEventListener("click", () => popup.remove());
  
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
  }
  
  }
}
