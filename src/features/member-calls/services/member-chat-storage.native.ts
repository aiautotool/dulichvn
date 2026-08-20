import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { MemberChatMessage } from './member-social-api';

const STORAGE_PREFIX = 'vinago:member-chat:v1:';
const LOCAL_URL_PREFIX = 'vinago-chat-file:';
const MAX_MESSAGES = 200;
let writeQueue: Promise<void> = Promise.resolve();

export async function loadStoredMemberChatMessages(memberId: string, friendId: string): Promise<MemberChatMessage[]> {
  const raw = await AsyncStorage.getItem(storageKey(memberId, friendId));
  if (!raw) return [];
  try {
    const messages = JSON.parse(raw) as MemberChatMessage[];
    if (!Array.isArray(messages)) return [];
    const hydrated = messages.filter(isStoredMessage).map((message) => hydrateMessage(memberId, friendId, message));
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
    const current = await loadStoredMemberChatMessages(memberId, friendId);
    await AsyncStorage.setItem(
      storageKey(memberId, friendId),
      JSON.stringify(current.filter((item) => item.id !== message.id).map((item) => toStoredMessage(memberId, friendId, item))),
    );
    if (message.attachment) {
      try {
        const file = new File(message.attachment.url);
        if (file.exists) file.delete();
      } catch {}
    }
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function persistMessage(memberId: string, friendId: string, message: MemberChatMessage): Promise<MemberChatMessage> {
  const persistedFile = message.attachment ? await persistAttachment(memberId, friendId, message) : null;
  const storedMessage = persistedFile
    ? { ...message, attachment: { ...message.attachment!, url: `${LOCAL_URL_PREFIX}${persistedFile.name}` } }
    : message;
  const current = await loadStoredMemberChatMessages(memberId, friendId);
  const storedCurrent = current.map((item) => toStoredMessage(memberId, friendId, item));
  const messages = [...storedCurrent.filter((item) => item.id !== storedMessage.id), storedMessage]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_MESSAGES);
  await AsyncStorage.setItem(storageKey(memberId, friendId), JSON.stringify(messages));
  return persistedFile ? { ...storedMessage, attachment: { ...storedMessage.attachment!, url: persistedFile.uri } } : storedMessage;
}

async function persistAttachment(memberId: string, friendId: string, message: MemberChatMessage) {
  const attachment = message.attachment!;
  const root = new Directory(Paths.document, 'vinago-member-chat', conversationId(memberId, friendId));
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
  if (attachment.url.startsWith(LOCAL_URL_PREFIX)) {
    const existing = new File(root, attachment.url.slice(LOCAL_URL_PREFIX.length));
    if (existing.exists) return existing;
  }
  if (attachment.url.startsWith(root.uri)) return new File(attachment.url);
  const extension = safeExtension(attachment.name);
  const target = new File(root, `${safeName(message.id)}${extension}`);
  if (!target.exists) {
    const bytes = await new File(attachment.url).bytes();
    target.create({ intermediates: true, overwrite: false });
    target.write(bytes);
  }
  return target;
}

function hydrateMessage(memberId: string, friendId: string, message: MemberChatMessage): MemberChatMessage | null {
  if (!message.attachment) return message;
  const root = new Directory(Paths.document, 'vinago-member-chat', conversationId(memberId, friendId));
  const storedUrl = message.attachment.url;
  const fileName = storedUrl.startsWith(LOCAL_URL_PREFIX) ? storedUrl.slice(LOCAL_URL_PREFIX.length) : storedUrl.split('/').pop();
  if (!fileName) return null;
  const currentFile = new File(root, fileName);
  if (currentFile.exists) return { ...message, attachment: { ...message.attachment, url: currentFile.uri } };
  try {
    const legacyFile = new File(storedUrl);
    return legacyFile.exists ? message : null;
  } catch {
    return null;
  }
}

function toStoredMessage(memberId: string, friendId: string, message: MemberChatMessage): MemberChatMessage {
  if (!message.attachment) return message;
  const root = new Directory(Paths.document, 'vinago-member-chat', conversationId(memberId, friendId));
  if (!message.attachment.url.startsWith(root.uri)) return message;
  return { ...message, attachment: { ...message.attachment, url: `${LOCAL_URL_PREFIX}${new File(message.attachment.url).name}` } };
}

function storageKey(memberId: string, friendId: string) {
  return `${STORAGE_PREFIX}${conversationId(memberId, friendId)}`;
}

function conversationId(memberId: string, friendId: string) {
  return [memberId, friendId].sort().map(safeName).join('--');
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function safeExtension(name: string) {
  const match = name.match(/\.[a-zA-Z0-9]{1,10}$/);
  return match ? match[0].toLowerCase() : '';
}

function isStoredMessage(value: MemberChatMessage) {
  return Boolean(value && typeof value.id === 'string' && typeof value.createdAt === 'number');
}
