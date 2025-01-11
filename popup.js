document.getElementById('solveCaptcha').addEventListener('click', function () {
    const captchaImage = document.querySelector('#imgcode'); // 獲取 CAPTCHA 圖像
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = captchaImage.width;
    canvas.height = captchaImage.height;
    ctx.drawImage(captchaImage, 0, 0);
  
    Tesseract.recognize(
      canvas.toDataURL(),
      'eng',
      {
        logger: (m) => console.log(m)
      }
    ).then(({ data: { text } }) => {
      const captchaText = text.trim(); // 獲取識別的文字
      console.log('識別的 CAPTCHA:', captchaText);
    }).catch(error => {
      console.error('OCR 識別錯誤:', error);
    });
  });
  