import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MemberChatMessage } from './member-social-api';

const STORAGE_PREFIX = 'vinago:member-chat:v1:';
const DB_NAME = 'vinago-member-chat-files';
const STORE_NAME = 'attachments';
const MAX_MESSAGES = 200;
const LOCAL_URL_PREFIX = 'vinago-chat-file:';
let writeQueue: Promise<void> = Promise.resolve();

export async function loadStoredMemberChatMessages(memberId: string, friendId: string): Promise<MemberChatMessage[]> {
  const raw = await AsyncStorage.getItem(storageKey(memberId, friendId));
  if (!raw) return [];
  try {
    const messages = JSON.parse(raw) as MemberChatMessage[];
    if (!Array.isArray(messages)) return [];
    const hydrated = await Promise.all(messages.filter(isStoredMessage).map(hydrateAttachment));
    return hydrated.filter((message): message is MemberChatMessage => Boolean(message)).sort((a, b) => a.createdAt - b.createdAt);
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
    const current = await readMetadata(memberId, friendId);
    const storedMessage = current.find((item) => item.id === message.id);
    await AsyncStorage.setItem(storageKey(memberId, friendId), JSON.stringify(current.filter((item) => item.id !== message.id)));
    if (storedMessage?.attachment?.url.startsWith(LOCAL_URL_PREFIX)) {
      await deleteBlob(storedMessage.attachment.url.slice(LOCAL_URL_PREFIX.length));
    }
    if (message.attachment?.url.startsWith('blob:')) URL.revokeObjectURL(message.attachment.url);
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function persistMessage(memberId: string, friendId: string, message: MemberChatMessage): Promise<MemberChatMessage> {
  let storedMessage = message;
  if (message.attachment && !message.attachment.url.startsWith(LOCAL_URL_PREFIX)) {
    const blob = await fetch(message.attachment.url).then((response) => response.blob());
    const fileKey = `${conversationId(memberId, friendId)}:${message.id}`;
    await putBlob(fileKey, blob);
    storedMessage = { ...message, attachment: { ...message.attachment, url: `${LOCAL_URL_PREFIX}${fileKey}` } };
  }
  const current = await readMetadata(memberId, friendId);
  const messages = [...current.filter((item) => item.id !== storedMessage.id), storedMessage]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(storageKey(memberId, friendId), JSON.stringify(messages));
  return message;
}

async function readMetadata(memberId: string, friendId: string): Promise<MemberChatMessage[]> {
  const raw = await AsyncStorage.getItem(storageKey(memberId, friendId));
  if (!raw) return [];
  try {
    const messages = JSON.parse(raw);
    return Array.isArray(messages) ? messages.filter(isStoredMessage) : [];
  } catch {
    return [];
  }
}

async function hydrateAttachment(message: MemberChatMessage): Promise<MemberChatMessage | null> {
  if (!message.attachment?.url.startsWith(LOCAL_URL_PREFIX)) return message;
  const blob = await getBlob(message.attachment.url.slice(LOCAL_URL_PREFIX.length));
  if (!blob) return null;
  return { ...message, attachment: { ...message.attachment, url: URL.createObjectURL(blob) } };
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putBlob(key: string, blob: Blob) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(blob, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

async function getBlob(key: string) {
  const db = await openDatabase();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result as Blob | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return blob;
}

async function deleteBlob(key: string) {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

function storageKey(memberId: string, friendId: string) {
  return `${STORAGE_PREFIX}${conversationId(memberId, friendId)}`;
}

function conversationId(memberId: string, friendId: string) {
  return [memberId, friendId].sort().join('--');
}

function isStoredMessage(value: MemberChatMessage) {
  return Boolean(value && typeof value.id === 'string' && typeof value.createdAt === 'number');
}
