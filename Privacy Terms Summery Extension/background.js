
chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "fetchAndSummarize") {
      console.log("Fetching and summarizing:", message.url);
  
      // Fetch the remote page
      fetch(message.url)
        .then(response => response.text())
        .then(fullText => {

          // If too long then it truncates
          const truncatedText = fullText.length > 5000 ? fullText.substring(0, 5000) + "..." : fullText;
  
          // Create a short prompt asking for a concise privacy policy summary
          const prompt = 
            "Summarize the privacy/terms policy for the following in 1-4 clear sentences, highlighting the details of the privacy polcy and if they collect data then what data they collect specifically (go in details about it), why do they collect these data, what they do with it, who do they share it with and for what reason?  Also, make sure to state this only if they do share payment info, explain why they share this. Also please ignore any code or navigation text and don't mention the word 'code'.:\n\n" + 
            truncatedText;
  
          // Call the OpenAI API
          return fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ------somepass------`
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: prompt }]
            })
          });
        })
        .then(apiResponse => {
          // Debug: Checks if API responded successfully
          if (!apiResponse.ok) {
            console.error("API request failed with status:", apiResponse.status);
            throw new Error("API request failed");
          }
          return apiResponse.json();
        })
        .then(data => {
          // Extract the summary
          if (data.choices && data.choices[0] && data.choices[0].message) {
            const summary = data.choices[0].message.content;

            // Send the summary back to the content script
            chrome.tabs.sendMessage(sender.tab.id, { action: "display", summary: summary });
          } else {
            console.error("Unexpected API response format:", data);
          }
        })
        .catch(error => console.error("Error in fetchAndSummarize:", error));
    }
  });
  