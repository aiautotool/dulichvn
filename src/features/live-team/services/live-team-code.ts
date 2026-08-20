import * as Crypto from 'expo-crypto';
import { Platform, Share } from 'react-native';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

export function createLiveTeamCode() {
  return Array.from(Crypto.getRandomBytes(CODE_LENGTH), (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export function normalizeLiveTeamCode(value: string) {
  const fromLink = value.match(/live-team\/([A-HJ-NP-Z2-9-]+)/i)?.[1] ?? value;
  return fromLink.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, CODE_LENGTH);
}

export function formatLiveTeamCode(value: string) {
  const code = normalizeLiveTeamCode(value);
  return code.length > 5 ? `${code.slice(0, 5)}-${code.slice(5)}` : code;
}

export function liveTeamInviteLink(code: string) {
  return `https://vinago.aiautotool.com/live-team/${normalizeLiveTeamCode(code)}`;
}

export async function shareLiveTeam(code: string, teamName: string) {
  const link = liveTeamInviteLink(code);
  const message = `Tham gia Live Team “${teamName}” trên Vinago+: ${formatLiveTeamCode(code)}\n${link}`;
  if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
    await navigator.share({ title: teamName, text: message, url: link });
    return;
  }
  await Share.share({ title: `Mời vào ${teamName}`, message });
}
