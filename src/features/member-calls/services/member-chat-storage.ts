import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MemberChatMessage } from './member-social-api';

const STORAGE_PREFIX = 'vinago:member-chat:v1:';
let writeQueue: Promise<void> = Promise.resolve();

export async function loadStoredMemberChatMessages(memberId: string, friendId: string): Promise<MemberChatMessage[]> {
  const raw = await AsyncStorage.getItem(storageKey(memberId, friendId));
  if (!raw) return [];
  try {
    const messages = JSON.parse(raw);
    return Array.isArray(messages) ? messages : [];
  } catch {
    return [];
  }
}

export function persistMemberChatMessage(memberId: string, friendId: string, message: MemberChatMessage): Promise<MemberChatMessage> {
  const operation = writeQueue.then(() => persistMessage(memberId, friendId, message));
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export function deleteStoredMemberChatMessage(memberId: string, friendId: string, message: MemberChatMessage): Promise<void> {
  const operation = writeQueue.then(async () => {
    const current = await loadStoredMemberChatMessages(memberId, friendId);
    await AsyncStorage.setItem(storageKey(memberId, friendId), JSON.stringify(current.filter((item) => item.id !== message.id)));
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function persistMessage(memberId: string, friendId: string, message: MemberChatMessage) {
  const current = await loadStoredMemberChatMessages(memberId, friendId);
  const messages = [...current.filter((item) => item.id !== message.id), message]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-200);
  await AsyncStorage.setItem(storageKey(memberId, friendId), JSON.stringify(messages));
  return message;
}

function storageKey(memberId: string, friendId: string) {
  return `${STORAGE_PREFIX}${[memberId, friendId].sort().join('--')}`;
}
