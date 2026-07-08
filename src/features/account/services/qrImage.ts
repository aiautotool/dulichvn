export async function qrLoginDataUrl(_data: string): Promise<string> {
  throw new Error('QR image generation is only available on web.');
}
