import * as Crypto from 'expo-crypto';
import { Platform, Share } from 'react-native';

const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 10;

export function createMemberRoomCode() {
  return Array.from(Crypto.getRandomBytes(ROOM_CODE_LENGTH), (byte) => (
    ROOM_ALPHABET[byte % ROOM_ALPHABET.length]
  )).join('');
}

export async function createFriendRoomCode(firstMemberId: string, secondMemberId: string) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    [firstMemberId, secondMemberId].sort().join(':'),
  );
  return Array.from({ length: ROOM_CODE_LENGTH }, (_, index) => {
    const byte = Number.parseInt(digest.slice(index * 2, index * 2 + 2), 16);
    return ROOM_ALPHABET[byte % ROOM_ALPHABET.length];
  }).join('');
}

export function normalizeRoomCode(value: string) {
  return value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, ROOM_CODE_LENGTH);
}

export function formatRoomCode(value: string) {
  const normalized = normalizeRoomCode(value);
  return normalized.length > 5 ? `${normalized.slice(0, 5)}-${normalized.slice(5)}` : normalized;
}

export async function shareMemberRoomCode(roomCode: string) {
  const displayCode = formatRoomCode(roomCode);
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(displayCode);
    return;
  }
  await Share.share({
    title: 'Mời gọi video trên Vinago+',
    message: `Tham gia cuộc gọi video Vinago+ với mã phòng: ${displayCode}`,
  });
}
