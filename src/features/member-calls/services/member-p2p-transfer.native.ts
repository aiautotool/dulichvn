import { registerGlobals } from '@livekit/react-native';
import { File, Paths } from 'expo-file-system';
import { Room } from 'livekit-client';
import { getMemberCallCredentials } from './memberCallTokenApi';
import type { MemberChatAttachment, MemberChatUpload } from './member-social-api';

registerGlobals();

const TOPIC = 'vinago-member-chat-file-v1';

export type MemberP2PTransfer = {
  isPeerOnline: () => boolean;
  send: (upload: MemberChatUpload) => Promise<MemberChatAttachment>;
  disconnect: () => Promise<void>;
};

export async function connectMemberP2PTransfer(roomCode: string, friendId: string, onReceive: (attachment: MemberChatAttachment) => void | Promise<void>): Promise<MemberP2PTransfer> {
  const credentials = await getMemberCallCredentials(roomCode);
  const room = new Room();
  room.registerByteStreamHandler(TOPIC, (reader, participant) => {
    if (participant.identity !== friendId) return;
    void (async () => {
      const chunks = await reader.readAll();
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
      const bytes = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
      const safeName = `${Date.now()}-${reader.info.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const localFile = new File(Paths.cache, safeName);
      localFile.create({ overwrite: true, intermediates: true });
      localFile.write(bytes);
      await onReceive({
        kind: parseKind(reader.info.attributes?.kind),
        url: localFile.uri,
        name: reader.info.name,
        mimeType: reader.info.mimeType,
        size: totalSize,
        durationMs: parseDuration(reader.info.attributes?.durationMs),
      });
    })();
  });
  await room.connect(credentials.serverUrl, credentials.token, { autoSubscribe: false });

  return {
    isPeerOnline: () => room.remoteParticipants.has(friendId),
    send: async (upload) => {
      if (!room.remoteParticipants.has(friendId)) throw new Error('Người nhận chưa online trong khung chat.');
      const file = new File(upload.uri);
      const bytes = await file.bytes();
      const maxBytes = upload.kind === 'video' ? 25 * 1024 * 1024 : 12 * 1024 * 1024;
      if (bytes.byteLength > maxBytes) throw new Error(`File phải nhỏ hơn ${Math.round(maxBytes / 1024 / 1024)} MB.`);
      const writer = await room.localParticipant.streamBytes({
        name: upload.name,
        topic: TOPIC,
        mimeType: upload.mimeType,
        totalSize: bytes.byteLength,
        destinationIdentities: [friendId],
        attributes: { kind: upload.kind, durationMs: String(upload.durationMs ?? 0) },
      });
      for (let offset = 0; offset < bytes.byteLength; offset += 15_000) await writer.write(bytes.slice(offset, offset + 15_000));
      await writer.close();
      return { kind: upload.kind, url: upload.uri, name: upload.name, mimeType: upload.mimeType, size: bytes.byteLength, durationMs: upload.durationMs };
    },
    disconnect: async () => { room.unregisterByteStreamHandler(TOPIC); await room.disconnect(); },
  };
}

function parseKind(value?: string): MemberChatAttachment['kind'] {
  return value === 'image' || value === 'video' || value === 'audio' ? value : 'document';
}

function parseDuration(value?: string) {
  const duration = Number(value);
  return Number.isFinite(duration) && duration > 0 ? duration : undefined;
}
