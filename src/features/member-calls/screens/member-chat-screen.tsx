import { ArrowDown, ArrowLeft, ArrowUp, AudioLines, Ban, CheckCheck, ChevronRight, Download, FileSpreadsheet, FileText, Image as ImageIcon, Info, Mic, MoreHorizontal, Paperclip, Pause, Phone, Play, Plus, Search, Send, Smile, Star, Trash2, Users, Video, X } from 'lucide-react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Linking, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  deleteMemberChatMessage,
  getMemberBlockStatus,
  getMemberChatMessages,
  resolveMemberChatMediaUrl,
  sendMemberChatMessage,
  setMemberBlocked,
  type MemberChatAttachment,
  type MemberChatMessage,
  type MemberChatUpload,
  type MemberSocialProfile,
} from '../services/member-social-api';
import { connectMemberP2PTransfer, type MemberP2PTransfer } from '../services/member-p2p-transfer';
import { deleteStoredMemberChatMessage, loadStoredMemberChatMessages, persistMemberChatMessage } from '../services/member-chat-storage';
import { downloadMemberChatAttachment } from '../services/member-chat-download';
import { createFriendRoomCode } from '../roomCode';

type Props = {
  friend: MemberSocialProfile;
  friends?: MemberSocialProfile[];
  latestIncomingFriendId?: string | null;
  memberId: string;
  onBack: () => void;
  onCall: (mode: 'audio' | 'video') => void;
  onSelectFriend?: (friend: MemberSocialProfile) => void;
};

const EMOJIS = ['😀', '😂', '🥰', '😍', '😎', '🥳', '😊', '🙏', '👍', '❤️', '🔥', '🎉', '✈️', '🏝️', '📍', '🍜', '☕', '🌅', '🏕️', '🧳'];
const CHAT_RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, directory: 'document' as const };
const ONLINE_WINDOW_MS = 5 * 60 * 1_000;
const AVATAR_COLORS = [
  { background: '#ffe7e6', foreground: '#dc251f' },
  { background: '#eee6ff', foreground: '#7048e8' },
  { background: '#e2f2ff', foreground: '#2587d8' },
  { background: '#e2f7f3', foreground: '#168d7f' },
  { background: '#e5f6e9', foreground: '#189150' },
];

export function MemberChatScreen({ friend, friends = [], latestIncomingFriendId, memberId, onBack, onCall, onSelectFriend }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [messages, setMessages] = useState<MemberChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [emojiVisible, setEmojiVisible] = useState(false);
  const [infoVisible, setInfoVisible] = useState(width >= 1180);
  const [searchVisible, setSearchVisible] = useState(false);
  const [messageQuery, setMessageQuery] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [blockedByThem, setBlockedByThem] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const p2pTransferRef = useRef<MemberP2PTransfer | null>(null);
  const localMessagesLoadedRef = useRef(false);
  const audioRecorder = useAudioRecorder(CHAT_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(audioRecorder);
  const isOnline = Date.now() - friend.lastSeenAt < ONLINE_WINDOW_MS;
  const isWide = width >= 920;
  const contactBlocked = blocked || blockedByThem;
  const searchMatches = useMemo(() => {
    const query = messageQuery.trim().toLocaleLowerCase('vi-VN');
    if (!query) return messages;
    return messages.filter((message) => message.text.toLocaleLowerCase('vi-VN').includes(query) || message.attachment?.name.toLocaleLowerCase('vi-VN').includes(query));
  }, [messageQuery, messages]);
  const sharedMedia = useMemo(() => messages.filter((message) => message.attachment?.kind === 'image' || message.attachment?.kind === 'video'), [messages]);
  const sharedFiles = useMemo(() => messages.filter((message) => message.attachment?.kind === 'document'), [messages]);

  const appendMessage = useCallback(async (message: MemberChatMessage) => {
    const storedMessage = await persistMemberChatMessage(memberId, friend.id, message);
    setMessages((current) => mergeMessages(current, [storedMessage]));
    return storedMessage;
  }, [friend.id, memberId]);

  const loadMessages = useCallback(async () => {
    try {
      const [next, stored] = await Promise.all([
        getMemberChatMessages(friend.id),
        localMessagesLoadedRef.current ? Promise.resolve([]) : loadStoredMemberChatMessages(memberId, friend.id),
      ]);
      localMessagesLoadedRef.current = true;
      setMessages((current) => mergeMessages(current, stored, next));
      for (const message of next) void persistMemberChatMessage(memberId, friend.id, message);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể tải tin nhắn.');
    } finally {
      setLoading(false);
    }
  }, [friend.id, memberId]);

  useEffect(() => {
    localMessagesLoadedRef.current = false;
    setMessages([]);
    setLoading(true);
    void loadMessages();
    const timer = setInterval(() => { void loadMessages(); }, 3_000);
    return () => clearInterval(timer);
  }, [loadMessages]);

  useEffect(() => {
    let active = true;
    void getMemberBlockStatus(friend.id).then((status) => {
      if (!active) return;
      setBlocked(status.blockedByMe);
      setBlockedByThem(status.blockedByThem);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [friend.id]);

  useEffect(() => {
    let active = true;
    let transfer: MemberP2PTransfer | null = null;
    void (async () => {
      try {
        const roomCode = await createFriendRoomCode(memberId, friend.id);
        transfer = await connectMemberP2PTransfer(roomCode, friend.id, async (attachment) => {
          if (!active) return;
          await appendMessage({ id: `p2p-received-${Date.now()}-${Math.random()}`, senderId: friend.id, recipientId: memberId, text: '', attachment, createdAt: Date.now() });
        });
        if (!active) { await transfer.disconnect(); return; }
        p2pTransferRef.current = transfer;
      } catch (nextError) {
        if (active) setError(nextError instanceof Error ? nextError.message : 'Không thể mở kênh chia sẻ trực tiếp.');
      }
    })();
    return () => {
      active = false;
      p2pTransferRef.current = null;
      if (transfer) void transfer.disconnect();
    };
  }, [appendMessage, friend.id, memberId]);

  const sendText = async () => {
    const text = input.trim();
    if (!text || sending || contactBlocked) return;
    setSending(true);
    setError(null);
    setInput('');
    setEmojiVisible(false);
    try {
      await appendMessage(await sendMemberChatMessage(friend.id, text));
    } catch (nextError) {
      setInput(text);
      setError(nextError instanceof Error ? nextError.message : 'Không thể gửi tin nhắn.');
    } finally {
      setSending(false);
    }
  };

  const uploadAndSend = async (upload: MemberChatUpload) => {
    if (sending || contactBlocked) return;
    setSending(true);
    setError(null);
    setAttachmentMenuVisible(false);
    setEmojiVisible(false);
    try {
      const transfer = p2pTransferRef.current;
      if (!transfer) throw new Error('Kênh chia sẻ trực tiếp đang kết nối. Vui lòng thử lại.');
      if (!transfer.isPeerOnline()) throw new Error('Người nhận cần mở khung chat này để nhận file trực tiếp.');
      const attachment = await transfer.send(upload);
      await appendMessage({ id: `p2p-sent-${Date.now()}-${Math.random()}`, senderId: memberId, recipientId: friend.id, text: '', attachment, createdAt: Date.now() });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể gửi file đính kèm.');
    } finally {
      setSending(false);
    }
  };

  const pickPhotoOrVideo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Bạn cần cho phép truy cập thư viện ảnh để gửi ảnh hoặc video.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.82,
      videoMaxDuration: 60,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const kind = asset.type === 'video' ? 'video' : 'image';
    await uploadAndSend({
      uri: asset.uri,
      name: asset.fileName || `${kind}-${Date.now()}.${kind === 'video' ? 'mp4' : 'jpg'}`,
      mimeType: asset.mimeType || (kind === 'video' ? 'video/mp4' : 'image/jpeg'),
      kind,
      webFile: asset.file,
    });
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, multiple: false, type: '*/*' });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await uploadAndSend({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType || 'application/octet-stream',
      kind: 'document',
      webFile: asset.file,
    });
  };

  const startRecording = async () => {
    setAttachmentMenuVisible(false);
    setEmojiVisible(false);
    setError(null);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setError('Bạn cần cho phép sử dụng micro để gửi tin nhắn thoại.');
        return;
      }
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể bắt đầu ghi âm.');
    }
  };

  const finishRecording = async (shouldSend: boolean) => {
    const durationMs = recorderState.durationMillis;
    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      const uri = audioRecorder.uri;
      if (!shouldSend || !uri) return;
      const isWeb = Platform.OS === 'web';
      const webFile = isWeb ? await fetch(uri).then((response) => response.blob()) : undefined;
      await uploadAndSend({
        uri,
        name: `ghi-am-${Date.now()}.${isWeb ? 'webm' : 'm4a'}`,
        mimeType: isWeb ? 'audio/webm' : 'audio/mp4',
        kind: 'audio',
        durationMs,
        webFile,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể gửi bản ghi âm.');
    }
  };

  const downloadAttachment = async (attachment: MemberChatAttachment) => {
    setError(null);
    try {
      await downloadMemberChatAttachment(attachment);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Không thể tải tài liệu.');
    }
  };

  const deleteMessage = async (message: MemberChatMessage) => {
    setMessages((current) => current.filter((item) => item.id !== message.id));
    setError(null);
    try {
      await deleteStoredMemberChatMessage(memberId, friend.id, message);
      if (!message.attachment) await deleteMemberChatMessage(friend.id, message.id);
    } catch (nextError) {
      setMessages((current) => mergeMessages(current, [message]));
      setError(nextError instanceof Error ? nextError.message : 'Không thể xoá tin nhắn.');
    }
  };

  const confirmDeleteMessage = (message: MemberChatMessage) => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm('Xoá tin nhắn này?')) void deleteMessage(message);
      return;
    }
    Alert.alert('Xoá tin nhắn', 'Tin nhắn sẽ bị xoá khỏi cuộc trò chuyện.', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => { void deleteMessage(message); } },
    ]);
  };

  const toggleBlocked = () => {
    if (blockBusy) return;
    const nextBlocked = !blocked;
    const apply = async () => {
      setBlockBusy(true);
      setError(null);
      try {
        const status = await setMemberBlocked(friend.id, nextBlocked);
        setBlocked(status.blockedByMe);
        setBlockedByThem(status.blockedByThem);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : 'Không thể cập nhật trạng thái chặn.');
      } finally {
        setBlockBusy(false);
      }
      setAttachmentMenuVisible(false);
      setEmojiVisible(false);
      setMoreVisible(false);
    };
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || window.confirm(nextBlocked ? `Chặn ${friend.name}? Bạn sẽ không thể gửi tin nhắn hoặc gọi.` : `Bỏ chặn ${friend.name}?`)) void apply();
      return;
    }
    Alert.alert(nextBlocked ? 'Chặn người dùng' : 'Bỏ chặn người dùng', nextBlocked ? `Bạn sẽ không thể gửi tin nhắn hoặc gọi cho ${friend.name}.` : `Bạn có thể tiếp tục liên hệ với ${friend.name}.`, [
      { text: 'Huỷ', style: 'cancel' },
      { text: nextBlocked ? 'Chặn' : 'Bỏ chặn', style: nextBlocked ? 'destructive' : 'default', onPress: () => { void apply(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      keyboardVerticalOffset={0}
      style={styles.wrap}
    >
      <View style={styles.workspace}>
        {width >= 1160 ? <ConversationList activeFriend={friend} friends={friends} latestIncomingFriendId={latestIncomingFriendId} onNewChat={onBack} onSelectFriend={onSelectFriend} /> : null}
        {isWide || !infoVisible ? (
          <View style={styles.chatPane}>
            <View style={styles.header}>
              <Pressable accessibilityLabel="Quay lại" hitSlop={8} style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]} onPress={onBack}><ArrowLeft color="#373b42" size={22} /></Pressable>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
                {isOnline ? <View style={styles.onlineDot} /> : null}
              </View>
              <View style={styles.headerCopy}>
                <Text numberOfLines={1} style={styles.name}>{friend.name}</Text>
                <Text style={[styles.status, isOnline && styles.statusOnline]}>{isOnline ? 'Online' : formatLastSeen(friend.lastSeenAt)}</Text>
              </View>
              <Pressable accessibilityLabel="Tìm kiếm tin nhắn" style={({ pressed }) => [styles.headerButton, searchVisible && styles.headerButtonActive, pressed && styles.pressed]} onPress={() => { setSearchVisible((current) => !current); setMessageQuery(''); }}><Search color="#4f545c" size={22} /></Pressable>
              <Pressable accessibilityLabel="Gọi thoại" disabled={contactBlocked} style={({ pressed }) => [styles.headerButton, contactBlocked && styles.disabled, pressed && styles.pressed]} onPress={() => onCall('audio')}><Phone color="#4f545c" size={22} /></Pressable>
              <Pressable accessibilityLabel="Gọi video" disabled={contactBlocked} style={({ pressed }) => [styles.headerButton, contactBlocked && styles.disabled, pressed && styles.pressed]} onPress={() => onCall('video')}><Video color="#4f545c" size={23} /></Pressable>
              <Pressable accessibilityLabel="Thông tin hội thoại" style={({ pressed }) => [styles.headerButton, infoVisible && styles.headerButtonActive, pressed && styles.pressed]} onPress={() => setInfoVisible(true)}><Info color="#4f545c" size={22} /></Pressable>
            </View>

            {searchVisible ? (
              <View style={styles.searchBar}>
                <Search color="#858991" size={18} />
                <TextInput autoFocus onChangeText={setMessageQuery} placeholder="Tìm trong cuộc trò chuyện" placeholderTextColor="#9a9da3" style={styles.searchInput} value={messageQuery} />
                {messageQuery ? <Text style={styles.searchCount}>{searchMatches.length} kết quả</Text> : null}
                <Pressable accessibilityLabel="Kết quả trước" style={styles.miniButton} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}><ArrowUp color="#6f737b" size={17} /></Pressable>
                <Pressable accessibilityLabel="Kết quả sau" style={styles.miniButton} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}><ArrowDown color="#6f737b" size={17} /></Pressable>
                <Pressable accessibilityLabel="Đóng tìm kiếm" style={styles.miniButton} onPress={() => { setSearchVisible(false); setMessageQuery(''); }}><X color="#6f737b" size={18} /></Pressable>
              </View>
            ) : null}

            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.messageList}
              contentInsetAdjustmentBehavior="automatic"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              onContentSizeChange={() => !messageQuery && scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {loading ? <View style={styles.loadingWrap}><ActivityIndicator color="#da251d" /></View> : null}
              {!loading && messages.length === 0 ? (
                <View style={styles.emptyCard}>
                  <View style={styles.emptyAvatar}><Text style={styles.emptyAvatarText}>{getInitials(friend.name)}</Text></View>
                  <Text style={styles.emptyTitle}>Bắt đầu trò chuyện</Text>
                  <Text style={styles.empty}>Gửi lời chào đến {friend.name} và cùng nhau lên kế hoạch cho chuyến đi tiếp theo.</Text>
                </View>
              ) : null}
              {!loading && messageQuery && searchMatches.length === 0 ? <Text style={styles.noResults}>Không tìm thấy tin nhắn phù hợp.</Text> : null}
              {searchMatches.map((message, index) => {
                const mine = message.senderId === memberId;
                const previous = searchMatches[index - 1];
                const next = searchMatches[index + 1];
                const showDate = !previous || !isSameDay(previous.createdAt, message.createdAt);
                const startsGroup = !previous || previous.senderId !== message.senderId || message.createdAt - previous.createdAt > 5 * 60 * 1_000;
                const endsGroup = !next || next.senderId !== message.senderId || next.createdAt - message.createdAt > 5 * 60 * 1_000;
                return (
                  <View key={message.id}>
                    {showDate ? <View style={styles.dateRow}><View style={styles.dateLine} /><Text style={styles.dateText}>{formatMessageDate(message.createdAt)}</Text><View style={styles.dateLine} /></View> : null}
                    <SwipeableChatMessage
                      friendInitials={getInitials(friend.name)}
                      message={message}
                      mine={mine}
                      startsGroup={startsGroup}
                      endsGroup={endsGroup}
                      onDelete={() => confirmDeleteMessage(message)}
                      onDownload={(attachment) => void downloadAttachment(attachment)}
                    />
                  </View>
                );
              })}
            </ScrollView>

            {error ? <Text selectable style={styles.error}>{error}</Text> : null}
            {attachmentMenuVisible ? (
              <View style={styles.attachmentMenu}>
                <Pressable style={styles.attachmentOption} onPress={() => void pickPhotoOrVideo()}><View style={[styles.attachmentIcon, styles.mediaIcon]}><ImageIcon color="#ffffff" size={22} /></View><Text style={styles.attachmentOptionText}>Ảnh & video</Text></Pressable>
                <Pressable style={styles.attachmentOption} onPress={() => void pickDocument()}><View style={[styles.attachmentIcon, styles.documentIcon]}><FileText color="#ffffff" size={22} /></View><Text style={styles.attachmentOptionText}>Tài liệu</Text></Pressable>
              </View>
            ) : null}
            {emojiVisible ? <View style={styles.emojiPanel}>{EMOJIS.map((emoji) => <Pressable key={emoji} style={styles.emojiButton} onPress={() => setInput((current) => `${current}${emoji}`)}><Text style={styles.emoji}>{emoji}</Text></Pressable>)}</View> : null}
            {contactBlocked ? (
              <View style={[styles.blockedComposer, { paddingBottom: Math.max(insets.bottom, 10) }]}><Ban color="#da251d" size={18} /><Text style={styles.blockedText}>{blockedByThem && !blocked ? 'Người dùng này hiện không nhận liên hệ.' : 'Bạn đã chặn người dùng này.'}</Text>{blocked ? <Pressable disabled={blockBusy} onPress={toggleBlocked}><Text style={styles.unblockText}>{blockBusy ? 'Đang xử lý…' : 'Bỏ chặn'}</Text></Pressable> : null}</View>
            ) : recorderState.isRecording ? (
              <View style={[styles.recordingComposer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
                <Pressable accessibilityLabel="Hủy ghi âm" style={styles.composerIcon} onPress={() => void finishRecording(false)}><X color="#6b7280" size={22} /></Pressable>
                <View style={styles.recordingStatus}><View style={styles.recordingDot} /><Text style={styles.recordingTime}>Đang ghi {formatDuration(recorderState.durationMillis)}</Text></View>
                <Pressable accessibilityLabel="Dừng và gửi ghi âm" style={styles.sendButton} onPress={() => void finishRecording(true)}><Send color="#ffffff" size={18} /></Pressable>
              </View>
            ) : (
              <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
                <View style={styles.inputShell}>
                  <Pressable accessibilityLabel="Đính kèm file" style={styles.composerIcon} onPress={() => { setAttachmentMenuVisible((current) => !current); setEmojiVisible(false); }}><Paperclip color={attachmentMenuVisible ? '#da251d' : '#6f747c'} size={22} /></Pressable>
                  <TextInput multiline maxLength={2_000} onChangeText={setInput} onFocus={() => { setAttachmentMenuVisible(false); setEmojiVisible(false); }} placeholder="Nhập tin nhắn..." placeholderTextColor="#93969c" style={styles.input} value={input} />
                  <Pressable accessibilityLabel="Chọn emoji" style={styles.composerIcon} onPress={() => { setEmojiVisible((current) => !current); setAttachmentMenuVisible(false); }}><Smile color={emojiVisible ? '#da251d' : '#6f747c'} size={22} /></Pressable>
                  {!input.trim() ? <Pressable accessibilityLabel="Ghi âm" disabled={sending} style={styles.composerIcon} onPress={() => void startRecording()}><Mic color="#6f747c" size={22} /></Pressable> : null}
                  <Pressable accessibilityLabel="Gửi tin nhắn" disabled={sending || !input.trim()} style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonIdle]} onPress={() => void sendText()}>{sending ? <ActivityIndicator color="#ffffff" size="small" /> : <Send color="#ffffff" size={18} />}</Pressable>
                </View>
              </View>
            )}
          </View>
        ) : null}

        {infoVisible ? (
          <ConversationInfoPanel
            blocked={blocked}
            contactBlocked={contactBlocked}
            friend={friend}
            isOnline={isOnline}
            isWide={isWide}
            media={sharedMedia}
            files={sharedFiles}
            moreVisible={moreVisible}
            onBlock={toggleBlocked}
            onCall={onCall}
            onClose={() => setInfoVisible(false)}
            onDownload={(attachment) => void downloadAttachment(attachment)}
            onMore={() => setMoreVisible((current) => !current)}
            onSearch={() => { setInfoVisible(false); setSearchVisible(true); }}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function ConversationList({ activeFriend, friends, latestIncomingFriendId, onNewChat, onSelectFriend }: {
  activeFriend: MemberSocialProfile;
  friends: MemberSocialProfile[];
  latestIncomingFriendId?: string | null;
  onNewChat: () => void;
  onSelectFriend?: (friend: MemberSocialProfile) => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'favorite'>('all');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const filteredFriends = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN');
    return friends.filter((item) => {
      if (filter === 'unread' && item.id !== latestIncomingFriendId) return false;
      if (filter === 'favorite' && !favorites.has(item.id)) return false;
      return !normalizedQuery || item.name.toLocaleLowerCase('vi-VN').includes(normalizedQuery) || item.email.toLocaleLowerCase('vi-VN').includes(normalizedQuery);
    });
  }, [favorites, filter, friends, latestIncomingFriendId, query]);
  const toggleFavorite = (id: string) => setFavorites((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  return (
    <View style={styles.conversationPane}>
      <View style={styles.conversationTitleRow}><Text style={styles.conversationTitle}>Trò chuyện</Text><Pressable accessibilityLabel="Tạo cuộc trò chuyện" style={styles.newChatButton} onPress={onNewChat}><Plus color="#da251d" size={22} /></Pressable></View>
      <View style={styles.conversationSearch}><Search color="#7f838a" size={18} /><TextInput onChangeText={setQuery} placeholder="Tìm kiếm" placeholderTextColor="#95989d" style={styles.conversationSearchInput} value={query} /></View>
      <View style={styles.filterRow}>
        <FilterChip active={filter === 'all'} label="Tất cả" onPress={() => setFilter('all')} />
        <FilterChip active={filter === 'unread'} label="Chưa đọc" onPress={() => setFilter('unread')} />
        <FilterChip active={filter === 'favorite'} label="Ưa thích" onPress={() => setFilter('favorite')} />
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        {filteredFriends.length ? filteredFriends.map((item, index) => {
          const active = item.id === activeFriend.id;
          const unread = item.id === latestIncomingFriendId && !active;
          return (
            <Pressable key={item.id} accessibilityLabel={`Mở trò chuyện với ${item.name}`} delayLongPress={450} style={[styles.conversationRow, active && styles.conversationRowActive]} onLongPress={() => toggleFavorite(item.id)} onPress={() => onSelectFriend?.(item)}>
              <View style={[styles.conversationAvatar, { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length].background }]}><Text style={[styles.conversationAvatarText, { color: AVATAR_COLORS[index % AVATAR_COLORS.length].foreground }]}>{getInitials(item.name)}</Text></View>
              <View style={styles.conversationCopy}><View style={styles.conversationNameRow}><Text numberOfLines={1} style={styles.conversationName}>{item.name}</Text>{favorites.has(item.id) ? <Star color="#f5a623" size={13} fill="#f5a623" /> : null}</View><Text numberOfLines={1} style={styles.conversationPreview}>{unread ? 'Bạn có tin nhắn mới' : item.email}</Text></View>
              <View style={styles.conversationMeta}><Text style={styles.conversationTime}>{formatConversationTime(item.lastSeenAt)}</Text>{unread ? <View style={styles.unreadBadge}><Text style={styles.unreadBadgeText}>1</Text></View> : null}</View>
            </Pressable>
          );
        }) : <Text style={styles.conversationEmpty}>{filter === 'favorite' ? 'Nhấn giữ một cuộc trò chuyện để thêm vào ưa thích.' : 'Không tìm thấy cuộc trò chuyện.'}</Text>}
      </ScrollView>
    </View>
  );
}

function FilterChip({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}><Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text></Pressable>;
}

function ConversationInfoPanel({ blocked, contactBlocked, friend, isOnline, isWide, media, files, moreVisible, onBlock, onCall, onClose, onDownload, onMore, onSearch }: {
  blocked: boolean;
  contactBlocked: boolean;
  friend: MemberSocialProfile;
  isOnline: boolean;
  isWide: boolean;
  media: MemberChatMessage[];
  files: MemberChatMessage[];
  moreVisible: boolean;
  onBlock: () => void;
  onCall: (mode: 'audio' | 'video') => void;
  onClose: () => void;
  onDownload: (attachment: MemberChatAttachment) => void;
  onMore: () => void;
  onSearch: () => void;
}) {
  return (
    <View style={[styles.infoPane, !isWide && styles.infoPaneMobile]}>
      <View style={styles.infoHeader}>
        {!isWide ? <Pressable accessibilityLabel="Quay lại trò chuyện" style={styles.headerButton} onPress={onClose}><ArrowLeft color="#42464d" size={22} /></Pressable> : null}
        <Text style={styles.infoHeaderTitle}>Thông tin hội thoại</Text>
        <Pressable accessibilityLabel="Đóng thông tin" style={styles.headerButton} onPress={onClose}><X color="#42464d" size={21} /></Pressable>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{getInitials(friend.name)}</Text>{isOnline ? <View style={styles.profileOnlineDot} /> : null}</View>
          <Text selectable style={styles.profileName}>{friend.name}</Text>
          <Text style={[styles.profileStatus, isOnline && styles.statusOnline]}>{isOnline ? 'Online' : formatLastSeen(friend.lastSeenAt)}</Text>
          <View style={styles.quickActions}>
            <InfoAction label="Gọi" icon={<Phone color="#4d5259" size={21} />} disabled={contactBlocked} onPress={() => onCall('audio')} />
            <InfoAction label="Video" icon={<Video color="#4d5259" size={22} />} disabled={contactBlocked} onPress={() => onCall('video')} />
            <InfoAction label="Tìm kiếm" icon={<Search color="#4d5259" size={21} />} onPress={onSearch} />
            <InfoAction label="Thêm" icon={<MoreHorizontal color="#4d5259" size={22} />} onPress={onMore} />
          </View>
          {moreVisible ? (
            <View style={styles.moreMenu}>
              <Pressable style={styles.moreMenuRow} onPress={onSearch}><Search color="#555a62" size={18} /><Text style={styles.moreMenuText}>Tìm trong hội thoại</Text></Pressable>
              <Pressable style={styles.moreMenuRow} onPress={onBlock}><Ban color="#da251d" size={18} /><Text style={styles.moreMenuDanger}>{blocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</Text></Pressable>
            </View>
          ) : null}
        </View>

        <InfoSection title="Giới thiệu">
          <Text selectable style={styles.aboutText}>{friend.email || 'Bạn đồng hành trên Vinago+'}</Text>
        </InfoSection>

        <InfoSection title={`Ảnh & video (${media.length})`}>
          {media.length ? (
            <ScrollView horizontal contentContainerStyle={styles.mediaStrip} showsHorizontalScrollIndicator={false}>
              {media.slice(-8).map((message) => {
                const attachment = message.attachment!;
                const url = resolveMemberChatMediaUrl(attachment.url);
                return attachment.kind === 'image' ? (
                  <Pressable key={message.id} onPress={() => void Linking.openURL(url)}><Image accessibilityLabel={attachment.name} source={{ uri: url }} style={{ width: 68, height: 68, borderRadius: 9, backgroundColor: '#ececee' }} /></Pressable>
                ) : (
                  <Pressable key={message.id} style={styles.videoThumb} onPress={() => void Linking.openURL(url)}><Video color="#ffffff" size={24} /><Text numberOfLines={1} style={styles.videoThumbText}>{attachment.name}</Text></Pressable>
                );
              })}
            </ScrollView>
          ) : <Text style={styles.infoEmpty}>Chưa có ảnh hoặc video được chia sẻ.</Text>}
        </InfoSection>

        <InfoSection title={`File đã chia sẻ (${files.length})`}>
          {files.length ? files.slice(-5).reverse().map((message) => {
            const attachment = message.attachment!;
            const spreadsheet = /\.(xlsx?|csv)$/i.test(attachment.name);
            return (
              <Pressable key={message.id} style={styles.sharedFileRow} onPress={() => onDownload(attachment)}>
                <View style={[styles.sharedFileIcon, spreadsheet && styles.spreadsheetIcon]}>{spreadsheet ? <FileSpreadsheet color="#159455" size={19} /> : <FileText color="#da251d" size={19} />}</View>
                <View style={styles.sharedFileCopy}><Text numberOfLines={1} style={styles.sharedFileName}>{attachment.name}</Text><Text style={styles.sharedFileMeta}>{formatBytes(attachment.size)} · {formatMessageDate(message.createdAt)}</Text></View>
                <ChevronRight color="#777b82" size={18} />
              </Pressable>
            );
          }) : <Text style={styles.infoEmpty}>Chưa có file được chia sẻ.</Text>}
        </InfoSection>

        <InfoSection title="Liên kết">
          <View style={styles.sharedGroupRow}><View style={styles.groupIcon}><Users color="#7048e8" size={19} /></View><Text style={styles.sharedGroupText}>Nhóm chung (0)</Text><ChevronRight color="#777b82" size={18} /></View>
        </InfoSection>

        <Pressable style={styles.blockButton} onPress={onBlock}><Ban color="#da251d" size={20} /><Text style={styles.blockButtonText}>{blocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function InfoAction({ disabled, icon, label, onPress }: { disabled?: boolean; icon: React.ReactNode; label: string; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} disabled={disabled} style={[styles.infoAction, disabled && styles.disabled]} onPress={onPress}><View style={styles.infoActionIcon}>{icon}</View><Text style={styles.infoActionLabel}>{label}</Text></Pressable>;
}

function InfoSection({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.infoSection}><View style={styles.infoSectionHeader}><Text style={styles.infoSectionTitle}>{title}</Text><ChevronRight color="#696d74" size={18} /></View>{children}</View>;
}

function SwipeableChatMessage({ friendInitials, message, mine, startsGroup, endsGroup, onDelete, onDownload }: { friendInitials: string; message: MemberChatMessage; mine: boolean; startsGroup: boolean; endsGroup: boolean; onDelete: () => void; onDownload: (attachment: MemberChatAttachment) => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionsVisibleRef = useRef(false);
  const gestureOriginRef = useRef(0);

  const setActionsVisible = useCallback((visible: boolean) => {
    actionsVisibleRef.current = visible;
    Animated.spring(translateX, { toValue: visible ? -68 : 0, useNativeDriver: true, speed: 24, bounciness: 0 }).start();
  }, [translateX]);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => mine && Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: () => { gestureOriginRef.current = actionsVisibleRef.current ? -68 : 0; },
    onPanResponderMove: (_event, gesture) => {
      translateX.setValue(Math.max(-76, Math.min(0, gestureOriginRef.current + gesture.dx)));
    },
    onPanResponderRelease: (_event, gesture) => setActionsVisible(gestureOriginRef.current + gesture.dx < -34),
    onPanResponderTerminate: () => setActionsVisible(actionsVisibleRef.current),
  }), [mine, setActionsVisible, translateX]);

  return (
    <View style={[styles.messageOuterRow, mine && styles.messageOuterRowMine, startsGroup && styles.messageGroupStart]}>
      {!mine ? <View style={styles.messageAvatarSlot}>{endsGroup ? <View style={styles.messageAvatar}><Text style={styles.messageAvatarText}>{friendInitials}</Text></View> : null}</View> : null}
      <View style={[styles.swipeMessageRow, mine ? styles.swipeMessageRowMine : styles.swipeMessageRowFriend]}>
      {mine ? (
        <View style={styles.swipeDeleteAction}>
          <Pressable accessibilityLabel="Xoá tin nhắn" style={styles.swipeDeleteButton} onPress={() => { setActionsVisible(false); onDelete(); }}>
            <Trash2 color="#ffffff" size={20} />
            <Text style={styles.swipeDeleteText}>Xoá</Text>
          </Pressable>
        </View>
      ) : null}
      <Animated.View style={[styles.bubble, mine ? styles.myBubble : styles.friendBubble, endsGroup && (mine ? styles.myBubbleLast : styles.friendBubbleLast), { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
        <Pressable delayLongPress={420} style={styles.messagePressable} onLongPress={() => mine && setActionsVisible(true)}>
          {message.attachment ? <ChatAttachment attachment={message.attachment} mine={mine} onDownload={() => onDownload(message.attachment!)} onLongPress={() => mine && setActionsVisible(true)} /> : null}
          {message.text ? <Text selectable style={[styles.messageText, mine && styles.myMessageText]}>{message.text}</Text> : null}
          <View style={styles.messageFooter}>
            <Text style={[styles.time, mine && styles.myTime]}>{formatMessageTime(message.createdAt)}</Text>
            {mine ? <CheckCheck color="#da251d" size={14} strokeWidth={2.2} /> : null}
          </View>
        </Pressable>
      </Animated.View>
      </View>
    </View>
  );
}

function ChatAttachment({ attachment, mine, onDownload, onLongPress }: { attachment: MemberChatAttachment; mine: boolean; onDownload: () => void; onLongPress: () => void }) {
  const url = resolveMemberChatMediaUrl(attachment.url);
  if (attachment.kind === 'image') {
    return <View><Pressable delayLongPress={420} onLongPress={onLongPress} onPress={() => void Linking.openURL(url)}><Image accessibilityLabel={attachment.name} source={{ uri: url }} style={{ width: 230, height: 172, borderRadius: 11, backgroundColor: '#e5e7eb' }} resizeMode="cover" /></Pressable><Pressable accessibilityLabel={`Tải ${attachment.name}`} style={styles.imageDownloadButton} onPress={onDownload}><Download color="#ffffff" size={17} /></Pressable></View>;
  }
  if (attachment.kind === 'audio') return <Pressable delayLongPress={420} onLongPress={onLongPress}><View style={styles.attachmentWithDownload}><AudioAttachment attachment={attachment} mine={mine} url={url} /><Pressable accessibilityLabel={`Tải ${attachment.name}`} style={styles.inlineDownloadButton} onPress={onDownload}><Download color="#da251d" size={17} /></Pressable></View></Pressable>;
  const isVideo = attachment.kind === 'video';
  return (
    <View style={[styles.fileAttachment, mine && styles.myFileAttachment]}>
      <Pressable delayLongPress={420} style={styles.fileOpenButton} onLongPress={onLongPress} onPress={() => void Linking.openURL(url)}>
        {isVideo ? <Video color="#da251d" size={25} /> : <FileText color="#da251d" size={25} />}
        <View style={styles.fileCopy}>
          <Text numberOfLines={2} style={[styles.fileName, mine && styles.myMessageText]}>{attachment.name}</Text>
          <Text style={[styles.fileSize, mine && styles.myTime]}>{isVideo ? 'Video · ' : ''}{formatBytes(attachment.size)}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityLabel={`Tải ${attachment.name}`} style={styles.inlineDownloadButton} onPress={onDownload}><Download color="#da251d" size={18} /></Pressable>
    </View>
  );
}

function AudioAttachment({ attachment, mine, url }: { attachment: MemberChatAttachment; mine: boolean; url: string }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish) void player.seekTo(0);
      player.play();
    }
  };
  return (
    <View style={styles.audioAttachment}>
      <Pressable accessibilityLabel={status.playing ? 'Tạm dừng' : 'Phát ghi âm'} style={[styles.audioPlay, mine && styles.myAudioPlay]} onPress={toggle}>
        {status.playing ? <Pause color="#ffffff" size={17} fill="#ffffff" /> : <Play color="#ffffff" size={17} fill="#ffffff" />}
      </Pressable>
      <AudioLines color="#da251d" size={35} />
      <Text style={[styles.audioDuration, mine && styles.myMessageText]}>{formatDuration(attachment.durationMs || status.duration * 1_000)}</Text>
    </View>
  );
}

function formatMessageTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatMessageDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(timestamp, today.getTime())) return 'Hôm nay';
  if (isSameDay(timestamp, yesterday.getTime())) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatLastSeen(timestamp: number) {
  if (!timestamp) return 'Bạn đồng hành';
  const date = new Date(timestamp);
  if (isSameDay(timestamp, Date.now())) return `Hoạt động lúc ${formatMessageTime(timestamp)}`;
  return `Hoạt động ${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}`;
}

function formatConversationTime(timestamp: number) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isSameDay(timestamp, Date.now())) return formatMessageTime(timestamp);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(timestamp, yesterday.getTime())) return 'Hôm qua';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function isSameDay(first: number, second: number) {
  const firstDate = new Date(first);
  const secondDate = new Date(second);
  return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth() && firstDate.getDate() === secondDate.getDate();
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return `${words[0]?.[0] ?? '?'}${words.length > 1 ? words[words.length - 1][0] : ''}`.toUpperCase();
}

function mergeMessages(...groups: MemberChatMessage[][]) {
  const messages = new Map<string, MemberChatMessage>();
  for (const group of groups) for (const message of group) messages.set(message.id, message);
  return [...messages.values()].sort((first, second) => first.createdAt - second.createdAt);
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(0, Math.round(durationMs / 1_000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#ffffff' },
  workspace: { flex: 1, flexDirection: 'row', backgroundColor: '#ffffff' },
  conversationPane: { width: 330, backgroundColor: '#ffffff', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: '#e4e4e5' },
  conversationTitleRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24 },
  conversationTitle: { color: '#202125', fontSize: 22, fontWeight: '800' },
  newChatButton: { width: 40, height: 40, borderRadius: 11, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0ef' },
  conversationSearch: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 22, paddingHorizontal: 13, borderRadius: 11, borderCurve: 'continuous', borderWidth: 1, borderColor: '#d9dade', backgroundColor: '#ffffff' },
  conversationSearchInput: { flex: 1, height: 42, color: '#24262a', fontSize: 13.5 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 22, paddingVertical: 16 },
  filterChip: { minHeight: 34, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 17, backgroundColor: '#f7f7f8' },
  filterChipActive: { backgroundColor: '#ffe8e7' },
  filterChipText: { color: '#777b82', fontSize: 11.5, fontWeight: '600' },
  filterChipTextActive: { color: '#dc251f', fontWeight: '700' },
  conversationRow: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, paddingVertical: 11 },
  conversationRowActive: { backgroundColor: '#f0f7ff' },
  conversationAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  conversationAvatarText: { fontSize: 15, fontWeight: '800' },
  conversationCopy: { flex: 1, minWidth: 0, gap: 5 },
  conversationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  conversationName: { flexShrink: 1, color: '#25272b', fontSize: 14, fontWeight: '800' },
  conversationPreview: { color: '#72767d', fontSize: 11.5 },
  conversationMeta: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 3 },
  conversationTime: { color: '#7e8289', fontSize: 10.5, fontVariant: ['tabular-nums'] },
  unreadBadge: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d', paddingHorizontal: 5 },
  unreadBadgeText: { color: '#ffffff', fontSize: 9.5, fontWeight: '800', fontVariant: ['tabular-nums'] },
  conversationEmpty: { color: '#8b8e94', fontSize: 12, lineHeight: 18, textAlign: 'center', padding: 28 },
  chatPane: { flex: 1, minWidth: 0, backgroundColor: '#ffffff' },
  header: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7e7e8', zIndex: 3 },
  headerButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerButtonActive: { backgroundColor: '#fff0ef' },
  pressed: { backgroundColor: '#f4f4f5' },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe6e5', position: 'relative' },
  avatarText: { color: '#df211b', fontSize: 16, fontWeight: '800' },
  onlineDot: { position: 'absolute', right: -1, bottom: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#24bf65', borderWidth: 2, borderColor: '#ffffff' },
  headerCopy: { flex: 1, minWidth: 70, gap: 2 },
  name: { color: '#17181b', fontSize: 16, fontWeight: '800' },
  status: { color: '#7b7f86', fontSize: 11.5, fontWeight: '500' },
  statusOnline: { color: '#20a955', fontWeight: '600' },
  searchBar: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e9e9ea' },
  searchInput: { flex: 1, height: 38, color: '#202226', fontSize: 14, paddingHorizontal: 2 },
  searchCount: { color: '#777b82', fontSize: 11, fontWeight: '600' },
  miniButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f6f7' },
  messageList: { flexGrow: 1, width: '100%', maxWidth: 820, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 3, justifyContent: 'flex-end' },
  loadingWrap: { padding: 28 },
  emptyCard: { alignSelf: 'center', alignItems: 'center', maxWidth: 320, gap: 8, padding: 28 },
  emptyAvatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe8e7', marginBottom: 4 },
  emptyAvatarText: { color: '#dc251f', fontSize: 22, fontWeight: '800' },
  emptyTitle: { color: '#1f2024', fontSize: 17, fontWeight: '800' },
  empty: { color: '#747880', fontSize: 13, lineHeight: 19, fontWeight: '500', textAlign: 'center' },
  noResults: { alignSelf: 'center', color: '#777b82', fontSize: 13, padding: 24 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: '#e6e6e7' },
  dateText: { color: '#777b82', fontSize: 11.5, fontWeight: '500' },
  messageOuterRow: { width: '100%', flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageOuterRowMine: { justifyContent: 'flex-end' },
  messageAvatarSlot: { width: 34, minHeight: 1, alignItems: 'center', justifyContent: 'flex-end' },
  messageAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe7e6' },
  messageAvatarText: { color: '#dd251f', fontSize: 12, fontWeight: '800' },
  swipeMessageRow: { maxWidth: '78%', overflow: 'hidden', position: 'relative' },
  messageGroupStart: { paddingTop: 8 },
  swipeMessageRowMine: { alignItems: 'flex-end' },
  swipeMessageRowFriend: { alignItems: 'flex-start' },
  swipeDeleteAction: { position: 'absolute', top: 0, right: 0, bottom: 0, width: 68, alignItems: 'center', justifyContent: 'center' },
  swipeDeleteButton: { width: 58, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 14, backgroundColor: '#b42318' },
  swipeDeleteText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  messagePressable: { gap: 6 },
  bubble: { borderRadius: 16, borderCurve: 'continuous', paddingHorizontal: 16, paddingVertical: 11, gap: 5 },
  myBubble: { alignSelf: 'flex-end', backgroundColor: '#fff2f1', borderWidth: 1, borderColor: '#f5c9c6' },
  myBubbleLast: { borderBottomRightRadius: 5 },
  friendBubble: { alignSelf: 'flex-start', backgroundColor: '#f8f8f9', borderWidth: 1, borderColor: '#e2e2e4' },
  friendBubbleLast: { borderBottomLeftRadius: 5 },
  messageText: { color: '#23252a', fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#23252a' },
  messageFooter: { minHeight: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  time: { color: '#82868d', fontSize: 10.5, fontWeight: '500', textAlign: 'right', fontVariant: ['tabular-nums'] },
  myTime: { color: '#82868d' },
  chatImage: { width: 230, height: 172, borderRadius: 11, backgroundColor: '#e5e7eb' },
  imageDownloadButton: { position: 'absolute', right: 8, bottom: 8, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.62)' },
  attachmentWithDownload: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inlineDownloadButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  fileAttachment: { minWidth: 240, maxWidth: 310, flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: 12, borderCurve: 'continuous', backgroundColor: '#ffffff' },
  fileOpenButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 5 },
  myFileAttachment: { backgroundColor: 'rgba(255,255,255,0.68)' },
  fileCopy: { flex: 1, gap: 3 },
  fileName: { color: '#25272b', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  fileSize: { color: '#777b82', fontSize: 10.5, fontWeight: '500' },
  audioAttachment: { minWidth: 205, flexDirection: 'row', alignItems: 'center', gap: 9 },
  audioPlay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  myAudioPlay: { backgroundColor: '#da251d' },
  audioDuration: { color: '#555a62', fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  error: { color: '#b42318', fontSize: 12, fontWeight: '600', paddingHorizontal: 16, paddingVertical: 7, textAlign: 'center', backgroundColor: '#fff1f0' },
  attachmentMenu: { flexDirection: 'row', marginHorizontal: 14, marginBottom: 7, padding: 10, gap: 8, borderRadius: 16, borderCurve: 'continuous', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e5e6', boxShadow: '0 8px 24px rgba(35, 28, 24, 0.12)' },
  attachmentOption: { flex: 1, minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 13, backgroundColor: '#fafafa' },
  attachmentIcon: { width: 40, height: 40, borderRadius: 12, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  mediaIcon: { backgroundColor: '#9b51e0' },
  documentIcon: { backgroundColor: '#e12c26' },
  attachmentOptionText: { color: '#34383e', fontSize: 12.5, fontWeight: '700' },
  emojiPanel: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ececed' },
  emojiButton: { width: '10%', minWidth: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 23 },
  composer: { paddingHorizontal: 18, paddingTop: 9, backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e7e7e8' },
  inputShell: { width: '100%', minHeight: 50, maxHeight: 126, flexDirection: 'row', alignItems: 'flex-end', borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, borderColor: '#d9dadd', backgroundColor: '#ffffff' },
  composerIcon: { width: 40, height: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 120, minHeight: 48, color: '#1d2024', fontSize: 14.5, lineHeight: 20, paddingHorizontal: 3, paddingVertical: 13 },
  sendButton: { width: 40, height: 40, borderRadius: 10, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e42a24', margin: 4 },
  sendButtonIdle: { backgroundColor: '#f3a7a3' },
  disabled: { opacity: 0.42 },
  blockedComposer: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 9, backgroundColor: '#fff8f7', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#ead6d4' },
  blockedText: { color: '#6d5553', fontSize: 12.5, fontWeight: '600' },
  unblockText: { color: '#da251d', fontSize: 12.5, fontWeight: '800' },
  recordingComposer: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 8, backgroundColor: '#ffffff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e7e7e8' },
  recordingStatus: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 22, backgroundColor: '#fff1f0' },
  recordingDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#da251d' },
  recordingTime: { color: '#b42318', fontSize: 14, fontWeight: '800', fontVariant: ['tabular-nums'] },
  infoPane: { width: 340, backgroundColor: '#ffffff', borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: '#e4e4e5' },
  infoPaneMobile: { flex: 1, width: '100%' },
  infoHeader: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7e7e8' },
  infoHeaderTitle: { flex: 1, color: '#202125', fontSize: 14.5, fontWeight: '800' },
  profileCard: { alignItems: 'center', gap: 5, paddingHorizontal: 18, paddingTop: 28, paddingBottom: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7e7e8' },
  profileAvatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffe8e7', position: 'relative', marginBottom: 8 },
  profileAvatarText: { color: '#df251f', fontSize: 32, fontWeight: '800' },
  profileOnlineDot: { position: 'absolute', right: 5, bottom: 5, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#ffffff', backgroundColor: '#26bd65' },
  profileName: { color: '#202125', fontSize: 18, fontWeight: '800' },
  profileStatus: { color: '#7c8087', fontSize: 12, fontWeight: '500' },
  quickActions: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingTop: 20 },
  infoAction: { flex: 1, alignItems: 'center', gap: 7 },
  infoActionIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f6f6f7' },
  infoActionLabel: { color: '#62666d', fontSize: 10.5, fontWeight: '500' },
  moreMenu: { width: '100%', gap: 2, padding: 6, borderRadius: 12, borderWidth: 1, borderColor: '#e5e5e6', backgroundColor: '#ffffff', boxShadow: '0 6px 18px rgba(0,0,0,0.09)', marginTop: 7 },
  moreMenuRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, borderRadius: 8 },
  moreMenuText: { color: '#35383d', fontSize: 12.5, fontWeight: '600' },
  moreMenuDanger: { color: '#da251d', fontSize: 12.5, fontWeight: '600' },
  infoSection: { gap: 12, paddingHorizontal: 22, paddingVertical: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e7e7e8' },
  infoSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  infoSectionTitle: { color: '#27292d', fontSize: 13, fontWeight: '800' },
  aboutText: { color: '#666a71', fontSize: 12, lineHeight: 18 },
  infoEmpty: { color: '#92959a', fontSize: 11.5, lineHeight: 17 },
  mediaStrip: { gap: 7 },
  mediaThumb: { width: 68, height: 68, borderRadius: 9, backgroundColor: '#ececee' },
  videoThumb: { width: 78, height: 68, alignItems: 'center', justifyContent: 'center', gap: 3, padding: 5, borderRadius: 9, backgroundColor: '#555b63' },
  videoThumbText: { color: '#ffffff', fontSize: 8.5, textAlign: 'center' },
  sharedFileRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sharedFileIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0ef' },
  spreadsheetIcon: { backgroundColor: '#eaf8ef' },
  sharedFileCopy: { flex: 1, minWidth: 0, gap: 2 },
  sharedFileName: { color: '#303238', fontSize: 11.5, fontWeight: '600' },
  sharedFileMeta: { color: '#8b8e94', fontSize: 9.5 },
  sharedGroupRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  groupIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0eaff' },
  sharedGroupText: { flex: 1, color: '#52565d', fontSize: 12.5, fontWeight: '500' },
  blockButton: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 22, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eeeeef' },
  blockButtonText: { color: '#da251d', fontSize: 13, fontWeight: '600' },
});
