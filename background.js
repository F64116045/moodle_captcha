// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'loadTesseract') {
        chrome.scripting.executeScript(
            {
                target: { tabId: sender.tab.id },
                files: ['libs/tesseract.min.js']
            },
            (injectionResults) => {
                if (chrome.runtime.lastError) {
                    console.error('Failed to load script:', chrome.runtime.lastError);
                    sendResponse({ success: false });
                } else {
                    console.log('Script loaded successfully.');
                    sendResponse({ success: true });
                }
            }
        );
        return true;
    }
});