// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'loadTesseract') {
        // 使用 chrome.scripting API 加載腳本
        chrome.scripting.executeScript(
            {
                target: { tabId: sender.tab.id }, // 確保腳本加載到正確的 tab
                files: ['libs/tesseract.min.js'] // 指定本地腳本文件
            },
            (injectionResults) => {
                if (chrome.runtime.lastError) {
                    console.error('腳本加載失敗:', chrome.runtime.lastError);
                    sendResponse({ success: false });
                } else {
                    console.log('腳本加載成功');
                    sendResponse({ success: true });
                }
            }
        );

        // 必須返回 true，以便允許異步回應
        return true;
    }
});