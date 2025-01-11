// content.js

chrome.runtime.sendMessage({ action: 'loadTesseract' }, (response) => {
  console.log('消息響應:', response);
  if (response.success) {
      console.log('Tesseract.js 已經加載');
      initializeCaptchaHandling();
  } else {
      console.error('Tesseract.js 加載失敗');
  }
});

function initializeCaptchaHandling() {
  console.log('檢查 CAPTCHA 圖像是否已存在...');
  const captchaImage = document.querySelector('#imgcode');

  if (captchaImage && captchaImage.complete && captchaImage.naturalWidth > 0) {
      console.log('直接找到 CAPTCHA 圖像:', captchaImage);
      solveCaptcha(captchaImage);
  } else {
      console.log('未找到 CAPTCHA 圖像，開始監測 DOM 變化...');
      observeDomChanges();
  }
}

function observeDomChanges() {
  const observer = new MutationObserver(() => {
      console.log('DOM 發生變化，嘗試查找 CAPTCHA 圖像...');
      const captchaImage = document.querySelector('#imgcode');
      if (captchaImage && captchaImage.complete && captchaImage.naturalWidth > 0) {
          console.log('找到 CAPTCHA 圖像:', captchaImage);
          observer.disconnect(); // 停止監測
          solveCaptcha(captchaImage);
      }
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true, // 監測屬性變化
      attributeFilter: ['src'] // 監測 `src` 屬性變化
  });
}

function preprocessImage(captchaImage) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = captchaImage.naturalWidth || captchaImage.width;
  canvas.height = captchaImage.naturalHeight || captchaImage.height;

  ctx.drawImage(captchaImage, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const binary = gray > 128 ? 255 : 0;
      data[i] = binary;
      data[i + 1] = binary;
      data[i + 2] = binary;
  }

  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function solveCaptcha(captchaImage) {
  const processedCanvas = preprocessImage(captchaImage);

  Tesseract.recognize(
      processedCanvas.toDataURL(),
      'eng',
      {
          logger: (m) => console.log('OCR 進度:', m),
          tessedit_char_whitelist: '0123456789'
      }
  ).then(({ data: { text, confidence } }) => {
      if (confidence < 70) {
          console('可能有錯誤。');
          return;
      }
      const captchaText = text.trim();
      console.log('高信心 CAPTCHA 識別:', captchaText);

      const captchaInput = document.querySelector('#reg_vcode');
      if (captchaInput) {
          captchaInput.value = captchaText;
      }
  }).catch(error => {
      console.error('OCR 識別錯誤:', error);
  });
}