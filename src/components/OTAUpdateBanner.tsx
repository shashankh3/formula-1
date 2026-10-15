import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { DownloadCloud, RefreshCw, Sparkles } from 'lucide-react-native';
import { useAutoOTAUpdate } from '../utils/otaUpdates';
import { Colors, Radii } from '../theme/colors';

export default function OTAUpdateBanner() {
  const { isDownloading, isDownloaded, applyUpdate } = useAutoOTAUpdate();

  if (!isDownloading && !isDownloaded) {
    return null;
  }

  const onReload = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await applyUpdate();
  };

  return (
    <Animated.View entering={FadeInUp.duration(300)} exiting={FadeOutUp.duration(200)} style={styles.container}>
      {isDownloading ? (
        <View style={styles.downloadRow}>
          <DownloadCloud size={18} color="#FFFFFF" />
          <Text style={styles.downloadText}>Downloading new QuantFlow update in background...</Text>
        </View>
      ) : isDownloaded ? (
        <View style={styles.readyRow}>
          <View style={styles.readyInfo}>
            <Sparkles size={18} color={Colors.goldFace} />
            <View style={{ flex: 1 }}>
              <Text style={styles.readyTitle}>⚡ NEW UPDATE READY!</Text>
              <Text style={styles.readySub}>Tap reload to apply live changes immediately.</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onReload} style={styles.reloadBtn} activeOpacity={0.85}>
            <RefreshCw size={14} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.reloadBtnText}>RELOAD</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1E1E24',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 3,
    borderBottomColor: '#121216',
    zIndex: 9999,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
  },
  downloadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  readyInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  readySub: {
    color: '#AFAFAF',
    fontSize: 11,
    fontWeight: '700',
  },
  reloadBtn: {
    backgroundColor: Colors.greenFace,
    borderBottomWidth: 3,
    borderBottomColor: Colors.greenLip,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reloadBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
