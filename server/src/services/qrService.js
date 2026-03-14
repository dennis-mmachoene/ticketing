const QRCode = require('qrcode');

const generateQRCode = async (data) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      width: 200,
    });
    return qrDataUrl;
  } catch (error) {
    throw new Error('Failed to generate QR code: ' + error.message);
  }
};

const generateQRBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
      width: 200,
    });
    return buffer;
  } catch (error) {
    throw new Error('Failed to generate QR buffer: ' + error.message);
  }
};

module.exports = { generateQRCode, generateQRBuffer };
