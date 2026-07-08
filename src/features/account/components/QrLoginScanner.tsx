import { CameraView } from 'expo-camera';
import { ScanLine, X } from 'lucide-react-native';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export function QrLoginScanner({
  body,
  busy,
  onClose,
  onScanned,
  title,
  visible,
}: {
  body: string;
  busy: boolean;
  onClose: () => void;
  onScanned: (data: string) => void;
  title: string;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={styles.root}>
        <CameraView
          active={visible}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          facing="back"
          onBarcodeScanned={(result) => onScanned(result.data)}
          style={styles.camera}
        />
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityLabel="Close QR scanner"
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <X color="#ffffff" size={22} />
            </Pressable>
          </View>
          <View style={styles.guide}>
            <View style={styles.guideBox}>
              <ScanLine color="#ffffff" size={40} />
            </View>
            <Text style={styles.guideTitle}>{title}</Text>
            <Text style={styles.guideText}>{body}</Text>
            {busy ? <ActivityIndicator color="#ffffff" /> : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: '#111111',
    flex: 1,
  },
  camera: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    bottom: 0,
    justifyContent: 'space-between',
    left: 0,
    padding: 22,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingTop: 22,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.44)',
    borderRadius: 999,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  guide: {
    alignItems: 'center',
    gap: 12,
    paddingBottom: 54,
  },
  guideBox: {
    alignItems: 'center',
    borderColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 3,
    height: 238,
    justifyContent: 'center',
    width: 238,
  },
  guideTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  guideText: {
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    maxWidth: 310,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
