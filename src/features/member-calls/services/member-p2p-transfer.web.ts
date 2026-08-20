import { Room } from 'livekit-client';
import { getMemberCallCredentials } from './memberCallTokenApi';
import type { MemberChatAttachment, MemberChatUpload } from './member-social-api';

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
      const blob = new Blob(chunks.map((chunk) => chunk.slice().buffer as ArrayBuffer), { type: reader.info.mimeType });
      await onReceive({
        kind: parseKind(reader.info.attributes?.kind),
        url: URL.createObjectURL(blob),
        name: reader.info.name,
        mimeType: reader.info.mimeType,
        size: blob.size,
        durationMs: parseDuration(reader.info.attributes?.durationMs),
      });
    })();
  });
  await room.connect(credentials.serverUrl, credentials.token, { autoSubscribe: false });

  return {
    isPeerOnline: () => room.remoteParticipants.has(friendId),
    send: async (upload) => {
      if (!room.remoteParticipants.has(friendId)) throw new Error('Người nhận chưa online trong khung chat.');
      const blob: Blob = upload.webFile ?? await fetch(upload.uri).then((response) => response.blob());
      const maxBytes = upload.kind === 'video' ? 25 * 1024 * 1024 : 12 * 1024 * 1024;
      if (blob.size > maxBytes) throw new Error(`File phải nhỏ hơn ${Math.round(maxBytes / 1024 / 1024)} MB.`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
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
      return { kind: upload.kind, url: URL.createObjectURL(blob), name: upload.name, mimeType: upload.mimeType, size: blob.size, durationMs: upload.durationMs };
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
