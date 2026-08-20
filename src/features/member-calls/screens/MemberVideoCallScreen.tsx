import { Check, Clock, Copy, LocateFixed, LogIn, MapPin, MessageCircle, Phone, PhoneCall, RefreshCw, Search, ShieldCheck, UserPlus, Video, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MemberCallRoom } from './MemberCallRoom';
import { MemberChatScreen } from './member-chat-screen';
import {
  createFriendRoomCode,
  createMemberRoomCode,
  formatRoomCode,
  normalizeRoomCode,
  ROOM_CODE_LENGTH,
} from '../roomCode';
import {
  getMemberSocialOverview,
  inviteMemberFriendCall,
  respondToMemberFriendRequest,
  respondToMemberCallInvite,
  sendMemberFriendRequest,
  type MemberSocialOverview,
  type MemberSocialProfile,
} from '../services/member-social-api';

type Props = {
  isSignedIn: boolean;
  memberId: string;
  memberName: string;
  coordinates: { lat: number; lng: number } | null;
  locationPermission: 'checking' | 'undetermined' | 'granted' | 'denied';
  isLocating: boolean;
  onRequestLocation: () => Promise<{ lat: number; lng: number } | null>;
  onOpenAccount: () => void;
  initialFriendId?: string | null;
  onInitialFriendHandled?: () => void;
  onChatVisibilityChange?: (visible: boolean) => void;
};

const EMPTY_SOCIAL: MemberSocialOverview = { friends: [], incomingRequests: [], outgoingRequests: [], searchResults: [], incomingCall: null, nearbyMembers: [], latestIncomingMessage: null };

export function MemberVideoCallScreen({ isSignedIn, memberId, memberName, coordinates, locationPermission, isLocating, onRequestLocation, onOpenAccount, initialFriendId, onInitialFriendHandled, onChatVisibilityChange }: Props) {
  const { width } = useWindowDimensions();
  const [roomInput, setRoomInput] = useState('');
  const [activeCall, setActiveCall] = useState<{ roomCode: string; mode: 'audio' | 'video' } | null>(null);
  const [selectedChatFriend, setSelectedChatFriend] = useState<MemberSocialProfile | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [social, setSocial] = useState<MemberSocialOverview>(EMPTY_SOCIAL);
  const [friendQuery, setFriendQuery] = useState('');
  const [socialBusy, setSocialBusy] = useState(false);
  const [socialError, setSocialError] = useState<string | null>(null);
  const isCompact = width < 720;

  const normalizedInput = useMemo(() => normalizeRoomCode(roomInput), [roomInput]);

  const loadSocial = useCallback(async (query = '', coordinateOverride?: { lat: number; lng: number } | null) => {
    if (!isSignedIn) return;
    setSocialBusy(true);
    setSocialError(null);
    try {
      setSocial(await getMemberSocialOverview(query, coordinateOverride === undefined ? coordinates : coordinateOverride));
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể tải danh sách bạn bè.');
    } finally {
      setSocialBusy(false);
    }
  }, [coordinates, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setSocial(EMPTY_SOCIAL);
      return;
    }
    void loadSocial();
    const timer = setInterval(() => { void loadSocial(); }, 10_000);
    return () => clearInterval(timer);
  }, [isSignedIn, loadSocial]);

  useEffect(() => {
    if (!initialFriendId || selectedChatFriend) return;
    const friend = social.friends.find((item) => item.id === initialFriendId);
    if (!friend) return;
    setSelectedChatFriend(friend);
    onInitialFriendHandled?.();
  }, [initialFriendId, onInitialFriendHandled, selectedChatFriend, social.friends]);

  useEffect(() => {
    onChatVisibilityChange?.(Boolean(selectedChatFriend));
    return () => { if (selectedChatFriend) onChatVisibilityChange?.(false); };
  }, [onChatVisibilityChange, selectedChatFriend]);

  if (activeCall) {
    return (
      <MemberCallRoom
        roomCode={activeCall.roomCode}
        callMode={activeCall.mode}
        memberName={memberName}
        onLeave={() => setActiveCall(null)}
      />
    );
  }

  if (selectedChatFriend) {
    return (
      <MemberChatScreen
        friend={selectedChatFriend}
        friends={social.friends}
        latestIncomingFriendId={social.latestIncomingMessage?.sender.id}
        memberId={memberId}
        onBack={() => setSelectedChatFriend(null)}
        onCall={(mode) => void callFriend(selectedChatFriend, mode)}
        onSelectFriend={setSelectedChatFriend}
      />
    );
  }

  const createRoom = () => {
    if (!isSignedIn) {
      onOpenAccount();
      return;
    }
    setValidationMessage(null);
    setActiveCall({ roomCode: createMemberRoomCode(), mode: 'video' });
  };

  const joinRoom = () => {
    if (!isSignedIn) {
      onOpenAccount();
      return;
    }
    if (normalizedInput.length !== ROOM_CODE_LENGTH) {
      setValidationMessage('Mã phòng phải có đủ 10 ký tự.');
      return;
    }
    setValidationMessage(null);
    setActiveCall({ roomCode: normalizedInput, mode: 'video' });
  };

  async function callFriend(friend: MemberSocialProfile, mode: 'audio' | 'video') {
    setSocialError(null);
    try {
      const roomCode = await createFriendRoomCode(memberId, friend.id);
      await inviteMemberFriendCall(friend.id, roomCode, mode);
      setActiveCall({ roomCode, mode });
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể tạo phòng gọi với người bạn này.');
    }
  }

  const respondToIncomingCall = async (accept: boolean) => {
    const incomingCall = social.incomingCall;
    if (!incomingCall) return;
    setSocialBusy(true);
    setSocialError(null);
    try {
      await respondToMemberCallInvite(accept);
      setSocial((current) => ({ ...current, incomingCall: null }));
      if (accept) setActiveCall({ roomCode: incomingCall.roomCode, mode: incomingCall.mode });
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể trả lời cuộc gọi.');
    } finally {
      setSocialBusy(false);
    }
  };

  const sendFriendRequest = async (friend: MemberSocialProfile) => {
    setSocialBusy(true);
    setSocialError(null);
    try {
      await sendMemberFriendRequest(friend);
      setFriendQuery('');
      await loadSocial();
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể gửi lời mời kết bạn.');
    } finally {
      setSocialBusy(false);
    }
  };

  const enableNearbyMembers = async () => {
    setSocialError(null);
    try {
      const nextCoordinates = coordinates ?? await onRequestLocation();
      if (nextCoordinates) await loadSocial('', nextCoordinates);
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể lấy vị trí hiện tại.');
    }
  };

  const respondToRequest = async (friend: MemberSocialProfile, accept: boolean) => {
    setSocialBusy(true);
    setSocialError(null);
    try {
      await respondToMemberFriendRequest(friend.id, accept);
      await loadSocial();
    } catch (error) {
      setSocialError(error instanceof Error ? error.message : 'Không thể xử lý lời mời kết bạn.');
    } finally {
      setSocialBusy(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, isCompact && styles.contentCompact]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}><MessageCircle color="#ffffff" size={34} /></View>
        <View style={styles.heroCopy}>
          <View style={styles.freePill}><Text style={styles.freePillText}>MIỄN PHÍ</Text></View>
          <Text style={styles.title}>Chat với bạn đồng hành</Text>
          <Text style={styles.subtitle}>
            Nhắn tin, gửi ảnh, tài liệu, ghi âm và gọi trực tiếp với những thành viên đã kết bạn.
          </Text>
        </View>
      </View>

      {!isSignedIn ? (
        <View style={styles.signInCard}>
          <LogIn color="#da251d" size={28} />
          <View style={styles.flexOne}>
            <Text style={styles.cardTitle}>Đăng nhập để chat</Text>
            <Text style={styles.cardBody}>Chỉ thành viên đã đăng nhập mới có thể kết bạn, nhắn tin và gọi.</Text>
          </View>
          <Pressable style={styles.primaryButton} onPress={onOpenAccount}>
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.signedInNote}>
          <ShieldCheck color="#16794b" size={20} />
          <Text style={styles.signedInText}>Đang chat với tài khoản {memberName}</Text>
        </View>
      )}

      {isSignedIn ? (
        <View style={styles.companionSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.flexOne}>
              <Text style={styles.sectionTitle}>Cuộc trò chuyện</Text>
              <Text style={styles.sectionBody}>Chọn một người bạn để nhắn tin, gửi tài liệu hoặc gọi trực tiếp.</Text>
            </View>
            <Pressable accessibilityLabel="Làm mới danh sách bạn bè" disabled={socialBusy} style={styles.refreshButton} onPress={() => void loadSocial()}>
              <RefreshCw color="#da251d" size={18} />
            </Pressable>
          </View>

          <View style={styles.friendSearchRow}>
            <View style={styles.friendSearchInput}>
              <Search color="#777777" size={18} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={setFriendQuery}
                onSubmitEditing={() => void loadSocial(friendQuery)}
                placeholder="Tìm theo email hoặc tên thành viên"
                placeholderTextColor="#999999"
                returnKeyType="search"
                style={styles.friendSearchText}
                value={friendQuery}
              />
            </View>
            <Pressable disabled={socialBusy || friendQuery.trim().length < 3} style={[styles.searchButton, (socialBusy || friendQuery.trim().length < 3) && styles.buttonDisabled]} onPress={() => void loadSocial(friendQuery)}>
              <Text style={styles.primaryButtonText}>Tìm bạn</Text>
            </Pressable>
          </View>

          {socialError ? <Text selectable style={styles.validationText}>{socialError}</Text> : null}

          <View style={styles.nearbyCard}>
            <View style={styles.nearbyHeader}>
              <View style={styles.nearbyIcon}><LocateFixed color="#1769aa" size={22} /></View>
              <View style={styles.flexOne}>
                <Text style={styles.friendGroupTitle}>Thành viên quanh đây</Text>
                <Text style={styles.nearbyBody}>Tìm người muốn kết nối và đi du lịch chung trong bán kính 50 km.</Text>
              </View>
              <Pressable disabled={isLocating || locationPermission === 'checking'} style={[styles.nearbyButton, (isLocating || locationPermission === 'checking') && styles.buttonDisabled]} onPress={() => void enableNearbyMembers()}>
                <MapPin color="#1769aa" size={16} />
                <Text style={styles.nearbyButtonText}>{isLocating ? 'Đang tìm…' : coordinates ? 'Cập nhật' : 'Cho phép vị trí'}</Text>
              </Pressable>
            </View>
            {coordinates ? (
              social.nearbyMembers.length > 0 ? social.nearbyMembers.map((friend) => (
                <MemberRow key={`nearby-${friend.id}`} member={friend} detail={`${formatDistance(friend.distanceKm)} · Vị trí gần đúng`}>
                  <Pressable disabled={socialBusy} style={styles.addFriendButton} onPress={() => void sendFriendRequest(friend)}><UserPlus color="#da251d" size={17} /><Text style={styles.addFriendText}>Kết nối</Text></Pressable>
                </MemberRow>
              )) : <Text style={styles.emptyText}>Chưa tìm thấy thành viên nào trong bán kính 50 km.</Text>
            ) : <Text style={styles.locationPrivacyText}>Vinago+ chỉ hiển thị khoảng cách, không chia sẻ tọa độ chính xác của bạn.</Text>}
          </View>

          {social.incomingCall?.caller ? (
            <View style={styles.incomingCallCard}>
              <View style={styles.incomingCallIcon}><PhoneCall color="#ffffff" size={22} /></View>
              <View style={styles.flexOne}>
                <Text style={styles.incomingCallLabel}>{social.incomingCall.mode === 'audio' ? 'CUỘC GỌI THOẠI' : 'CUỘC GỌI VIDEO'}</Text>
                <Text style={styles.incomingCallName}>{social.incomingCall.caller.name}</Text>
                <Text style={styles.incomingCallEmail}>{social.incomingCall.caller.email}</Text>
              </View>
              <Pressable disabled={socialBusy} style={styles.rejectCallButton} onPress={() => void respondToIncomingCall(false)}><PhoneCall color="#666666" size={18} /></Pressable>
              <Pressable disabled={socialBusy} style={styles.answerCallButton} onPress={() => void respondToIncomingCall(true)}><PhoneCall color="#ffffff" size={19} /></Pressable>
            </View>
          ) : null}

          {social.incomingRequests.length > 0 ? (
            <View style={styles.friendGroup}>
              <Text style={styles.friendGroupTitle}>Lời mời kết bạn ({social.incomingRequests.length})</Text>
              {social.incomingRequests.map((friend) => (
                <MemberRow key={`incoming-${friend.id}`} member={friend}>
                  <Pressable disabled={socialBusy} style={styles.acceptButton} onPress={() => void respondToRequest(friend, true)}><Check color="#ffffff" size={17} /></Pressable>
                  <Pressable disabled={socialBusy} style={styles.rejectButton} onPress={() => void respondToRequest(friend, false)}><X color="#666666" size={17} /></Pressable>
                </MemberRow>
              ))}
            </View>
          ) : null}

          {social.searchResults.length > 0 ? (
            <View style={styles.friendGroup}>
              <Text style={styles.friendGroupTitle}>Kết quả tìm kiếm</Text>
              {social.searchResults.map((friend) => (
                <MemberRow key={`search-${friend.id}`} member={friend}>
                  <Pressable disabled={socialBusy} style={styles.addFriendButton} onPress={() => void sendFriendRequest(friend)}><UserPlus color="#da251d" size={17} /><Text style={styles.addFriendText}>Kết bạn</Text></Pressable>
                </MemberRow>
              ))}
            </View>
          ) : null}

          {social.outgoingRequests.length > 0 ? (
            <View style={styles.friendGroup}>
              <Text style={styles.friendGroupTitle}>Đang chờ đồng ý</Text>
              {social.outgoingRequests.map((friend) => (
                <MemberRow key={`outgoing-${friend.id}`} member={friend}><View style={styles.pendingPill}><Clock color="#8a6300" size={14} /><Text style={styles.pendingText}>Đã gửi lời mời</Text></View></MemberRow>
              ))}
            </View>
          ) : null}

          <View style={styles.friendGroup}>
            <Text style={styles.friendGroupTitle}>Bạn bè ({social.friends.length})</Text>
            {social.friends.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có bạn đồng hành. Tìm thành viên bằng email để kết bạn.</Text>
            ) : social.friends.map((friend) => (
              <MemberRow key={`friend-${friend.id}`} member={friend}>
                <Pressable accessibilityLabel={`Nhắn tin với ${friend.name}`} style={styles.chatFriendButton} onPress={() => setSelectedChatFriend(friend)}><MessageCircle color="#1769aa" size={18} /></Pressable>
                <Pressable accessibilityLabel={`Gọi thoại ${friend.name}`} style={styles.audioFriendButton} onPress={() => void callFriend(friend, 'audio')}><Phone color="#16794b" size={18} /></Pressable>
                <Pressable accessibilityLabel={`Gọi video ${friend.name}`} style={styles.callFriendButton} onPress={() => void callFriend(friend, 'video')}><Video color="#ffffff" size={18} /></Pressable>
              </MemberRow>
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.actionGrid, isCompact && styles.actionGridCompact]}>
        <View style={styles.actionCard}>
          <View style={styles.cardIcon}><UserPlus color="#da251d" size={26} /></View>
          <Text style={styles.cardTitle}>Tạo phòng mới</Text>
          <Text style={styles.cardBody}>Bạn sẽ nhận một mã phòng để gửi riêng cho thành viên khác.</Text>
          <Pressable style={styles.primaryButtonWide} onPress={createRoom}>
            <Video color="#ffffff" size={19} />
            <Text style={styles.primaryButtonText}>Tạo phòng & bắt đầu gọi</Text>
          </Pressable>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.cardIcon}><Copy color="#da251d" size={26} /></View>
          <Text style={styles.cardTitle}>Tham gia bằng mã</Text>
          <Text style={styles.cardBody}>Nhập mã phòng do thành viên khác gửi cho bạn.</Text>
          <TextInput
            accessibilityLabel="Mã phòng gọi video"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={11}
            onChangeText={(value) => {
              setRoomInput(formatRoomCode(value));
              setValidationMessage(null);
            }}
            onSubmitEditing={joinRoom}
            placeholder="VD: ABCDE-FG234"
            placeholderTextColor="#999999"
            returnKeyType="go"
            style={styles.codeInput}
            value={roomInput}
          />
          {validationMessage ? <Text style={styles.validationText}>{validationMessage}</Text> : null}
          <Pressable style={styles.secondaryButtonWide} onPress={joinRoom}>
            <Text style={styles.secondaryButtonText}>Tham gia cuộc gọi</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.privacyNote}>
        <ShieldCheck color="#666666" size={18} />
        <Text style={styles.privacyText}>Không thu phí. Không tạo job. Chỉ người có mã phòng và tài khoản Vinago+ mới tham gia được.</Text>
      </View>
    </ScrollView>
  );
}

function MemberRow({ member, detail, children }: { member: MemberSocialProfile; detail?: string; children: React.ReactNode }) {
  const initial = member.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}><Text style={styles.memberAvatarText}>{initial}</Text></View>
      <View style={styles.memberCopy}><Text style={styles.memberName}>{member.name}</Text><Text selectable style={styles.memberEmail}>{detail ?? member.email}</Text></View>
      <View style={styles.memberActions}>{children}</View>
    </View>
  );
}

function formatDistance(distanceKm?: number) {
  if (distanceKm === undefined) return 'Gần bạn';
  if (distanceKm < 1) return `${Math.max(100, Math.round(distanceKm * 1000 / 100) * 100)} m`;
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

const styles = StyleSheet.create({
  content: { width: '100%', maxWidth: 1040, alignSelf: 'center', padding: 30, gap: 22 },
  contentCompact: { padding: 16 },
  hero: { flexDirection: 'row', gap: 18, borderRadius: 20, padding: 24, backgroundColor: '#fff4f3', borderWidth: 1, borderColor: '#f6d4d1' },
  heroIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#da251d' },
  heroCopy: { flex: 1, alignItems: 'flex-start', gap: 7 },
  freePill: { borderRadius: 999, backgroundColor: '#dff5e9', paddingHorizontal: 10, paddingVertical: 4 },
  freePillText: { color: '#16794b', fontSize: 11, fontWeight: '900' },
  title: { color: '#1d1d1f', fontSize: Platform.OS === 'web' ? 28 : 24, lineHeight: 34, fontWeight: '900' },
  subtitle: { color: '#5d5d62', fontSize: 15, lineHeight: 23, fontWeight: '600', maxWidth: 720 },
  signInCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: 18, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e6e6e6' },
  signedInNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, borderRadius: 12, backgroundColor: '#effaf4' },
  signedInText: { color: '#16794b', fontSize: 13, fontWeight: '800' },
  companionSection: { gap: 16, padding: 22, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e6e6e6' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionTitle: { color: '#1d1d1f', fontSize: 21, fontWeight: '900' },
  sectionBody: { color: '#666666', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  refreshButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  friendSearchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  friendSearchInput: { flex: 1, minWidth: 220, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#cccccc', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#fafafa' },
  friendSearchText: { flex: 1, color: '#1d1d1f', fontSize: 14, paddingVertical: 12 },
  searchButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#da251d', paddingHorizontal: 20 },
  buttonDisabled: { opacity: 0.5 },
  friendGroup: { gap: 8 }, friendGroupTitle: { color: '#444444', fontSize: 13, fontWeight: '900' },
  memberRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 13, backgroundColor: '#f8f8f8' },
  memberAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  memberAvatarText: { color: '#da251d', fontSize: 18, fontWeight: '900' }, memberCopy: { flex: 1, minWidth: 100 }, memberName: { color: '#1d1d1f', fontSize: 14, fontWeight: '900' }, memberEmail: { color: '#777777', fontSize: 11, fontWeight: '600' }, memberActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  acceptButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16794b' }, rejectButton: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8e8e8' },
  addFriendButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 11, borderWidth: 1, borderColor: '#da251d', paddingHorizontal: 11 }, addFriendText: { color: '#da251d', fontSize: 12, fontWeight: '900' },
  pendingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: '#fff2c7', paddingHorizontal: 10, paddingVertical: 7 }, pendingText: { color: '#8a6300', fontSize: 11, fontWeight: '800' },
  chatFriendButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e5f2fb' }, audioFriendButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e3f5eb' }, callFriendButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#da251d' }, emptyText: { color: '#777777', fontSize: 13, lineHeight: 19, fontWeight: '600', paddingVertical: 8 },
  incomingCallCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: '#effaf4', borderWidth: 1, borderColor: '#b9e2ca', padding: 13 }, incomingCallIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16794b' }, incomingCallLabel: { color: '#16794b', fontSize: 10, fontWeight: '900' }, incomingCallName: { color: '#1d1d1f', fontSize: 16, fontWeight: '900' }, incomingCallEmail: { color: '#666666', fontSize: 11, fontWeight: '600' }, rejectCallButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e2e2', transform: [{ rotate: '135deg' }] }, answerCallButton: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16794b' },
  nearbyCard: { gap: 9, borderRadius: 15, borderWidth: 1, borderColor: '#cfe4f5', backgroundColor: '#f3f9fd', padding: 13 }, nearbyHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }, nearbyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#dceefa' }, nearbyBody: { color: '#61707d', fontSize: 12, lineHeight: 17, fontWeight: '600' }, nearbyButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 11, borderWidth: 1, borderColor: '#1769aa', paddingHorizontal: 11 }, nearbyButtonText: { color: '#1769aa', fontSize: 12, fontWeight: '900' }, locationPrivacyText: { color: '#61707d', fontSize: 11, lineHeight: 16, fontWeight: '600' },
  actionGrid: { flexDirection: 'row', gap: 18 },
  actionGridCompact: { flexDirection: 'column' },
  actionCard: { flex: 1, minWidth: 0, gap: 12, padding: 22, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e6e6e6' },
  cardIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fdebea' },
  cardTitle: { color: '#1d1d1f', fontSize: 18, fontWeight: '900' },
  cardBody: { flex: 1, color: '#666666', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  codeInput: { width: '100%', borderWidth: 1, borderColor: '#cccccc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#1d1d1f', backgroundColor: '#fafafa', fontSize: 20, letterSpacing: 2, fontWeight: '900', textAlign: 'center' },
  validationText: { color: '#b42318', fontSize: 12, fontWeight: '700' },
  primaryButton: { borderRadius: 10, backgroundColor: '#da251d', paddingHorizontal: 18, paddingVertical: 11 },
  primaryButtonWide: { minHeight: 48, borderRadius: 12, backgroundColor: '#da251d', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 13 },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryButtonWide: { minHeight: 48, borderRadius: 12, borderWidth: 1.5, borderColor: '#da251d', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  secondaryButtonText: { color: '#da251d', fontSize: 14, fontWeight: '900' },
  privacyNote: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: 12 },
  privacyText: { color: '#666666', fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  flexOne: { flex: 1, minWidth: 180 },
});
