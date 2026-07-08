import { Camera } from 'expo-camera';

export async function requestQrScannerPermission() {
  const permission = await Camera.requestCameraPermissionsAsync();
  return permission.granted;
}
