import QRCode from 'qrcode';

export async function qrLoginDataUrl(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 8,
    width: 260,
  });
}
