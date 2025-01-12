// content.js
chrome.runtime.sendMessage({ action: 'loadTesseract' }, (response) => {
  console.log('Message response:', response);
  if (response.success) {
      console.log('Tesseract.js loaded successfully.');
      initializeCaptchaHandler();
  } else {
      console.error('Failed to load Tesseract.js.');
  }
});

function initializeCaptchaHandler() {
  const captchaImage = document.querySelector('#imgcode');

  if (captchaImage && captchaImage.complete && captchaImage.naturalWidth > 0) {
      console.log('CAPTCHA image detected:', captchaImage);
      processCaptcha(captchaImage);
  } else {
      console.log('CAPTCHA image not found. Monitoring DOM changes...');
      observeDomForCaptcha();
  }
}

function observeDomForCaptcha() {
  const observer = new MutationObserver(() => {
      const captchaImage = document.querySelector('#imgcode');
      if (captchaImage && captchaImage.complete && captchaImage.naturalWidth > 0) {
          console.log('CAPTCHA image found:', captchaImage);
          observer.disconnect();
          processCaptcha(captchaImage);
      }
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src']
  });
}

function preprocessImage(image) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (naturalWidth === 0 || naturalHeight === 0) {
      console.error('Image dimensions are zero, cannot preprocess.');
      return null;
  }

  canvas.width = naturalWidth * 2;
  canvas.height = naturalHeight * 2;

  ctx.scale(2, 2);
  ctx.drawImage(image, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
      const gray = 0.3 * data[i] + 0.59 * data[i + 1] + 0.11 * data[i + 2];
      const binary = gray > 128 ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = binary;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function processCaptcha(captchaImage) {
  const processedCanvas = preprocessImage(captchaImage);

  if (!processedCanvas) {
      console.warn('Preprocessing failed, retrying...');
      captchaImage.click();
      setTimeout(() => processCaptcha(captchaImage), 1000);
      return;
  }

  Tesseract.recognize(processedCanvas.toDataURL(), 'eng', {
      logger: (m) => console.log('OCR Progress:', m),
      tessedit_char_whitelist: '0123456789'
  }).then(({ data: { text } }) => {
      const cleanedText = text.replace(/[^0-9]/g, '');
      if (cleanedText.length !== 4) {
          console.warn('Incorrect CAPTCHA length, retrying...');
          captchaImage.click(); // Click the image to refresh CAPTCHA
          setTimeout(() => processCaptcha(captchaImage), 1000); // Retry after 1 second
          return;
      }
      console.log('CAPTCHA identified:', cleanedText);

      const input = document.querySelector('#reg_vcode');
      if (input) input.value = cleanedText;
/*
      const loginButton = document.querySelector('#loginbtn'); // 根據 id 選擇按鈕
        if (loginButton) {
          console.log('找到登入按鈕，模擬點擊');
          loginButton.click(); // 模擬點擊按鈕
        } else {
          console.error('找不到登入按鈕');
        }


      const intervalId = setInterval(() => {
        const loginButton2 = document.querySelector('input[type="submit"].btn.btn-primary.btn-block');
        if (loginButton2) {
          console.log('找到登入按鈕，模擬點擊');
          loginButton2.click(); // 模擬點擊按鈕
          clearInterval(intervalId); // 停止定時檢查
        }
      }, 50); // 每 500 毫秒檢查一次
*/   

  }).catch(error => {
      console.error('OCR Error, retrying:', error);
      captchaImage.click(); // Click the image to refresh CAPTCHA
      setTimeout(() => processCaptcha(captchaImage), 1000); // Retry after 1 second
  });
}