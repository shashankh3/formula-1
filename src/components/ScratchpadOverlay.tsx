import React, { useCallback, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Pencil, Trash2, Undo2 } from 'lucide-react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '../theme/colors';

interface Stroke {
  d: string;
  color: string;
  width: number;
}

export default function ScratchpadOverlay({ locked, lockLabel }: { locked: boolean; lockLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [color, setColor] = useState<string>('#1CB0F6');
  const current = useRef('');
  const scale = useSharedValue(1);

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const toggle = () => {
    if (locked) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    }
    scale.value = withSpring(0.92, { damping: 10, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setOpen((o) => !o);
  };

  const pushStroke = useCallback((d: string, c: string) => {
    if (!d) return;
    setStrokes((s) => [...s, { d, color: c, width: 4 }]);
  }, []);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      current.current = `M ${e.x} ${e.y}`;
    })
    .onUpdate((e) => {
      current.current += ` L ${e.x} ${e.y}`;
    })
    .onEnd(() => {
      const d = current.current;
      const c = color;
      current.current = '';
      runOnJS(pushStroke)(d, c);
    });

  const undo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setStrokes((s) => s.slice(0, -1));
  };
  const clear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    setStrokes([]);
  };

  return (
    <>
      <Animated.View style={btnStyle}>
        <TouchableOpacity onPress={toggle} style={[styles.pill, locked && styles.pillLocked]} activeOpacity={0.85}>
          {locked ? (
            <Text style={styles.pillTextLocked}>🔒 {lockLabel ?? 'Mental Only'}</Text>
          ) : (
            <>
              <Pencil size={13} color="#1CB0F6" strokeWidth={2.6} />
              <Text style={styles.pillText}>{open ? 'Close Pad' : '✏️ Rough Pad'}</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {open && !locked && (
        <Modal
          visible={open && !locked}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setOpen(false)}
        >
          <View style={styles.modalRoot}>
            <GestureDetector gesture={pan}>
              <View style={styles.canvas}>
                <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                  {strokes.map((s, i) => (
                    <Path
                      key={i}
                      d={s.d}
                      stroke={s.color}
                      strokeWidth={s.width}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={0.95}
                    />
                  ))}
                </Svg>
              </View>
            </GestureDetector>
            <View style={styles.toolbar}>
              <TouchableOpacity
                onPress={() => {
                  setColor('#1CB0F6');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                style={[
                  styles.dot,
                  { backgroundColor: '#1CB0F6', borderWidth: color === '#1CB0F6' ? 3 : 0, borderColor: '#FFFFFF' },
                ]}
              />
              <TouchableOpacity
                onPress={() => {
                  setColor('#58CC02');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                style={[
                  styles.dot,
                  { backgroundColor: '#58CC02', borderWidth: color === '#58CC02' ? 3 : 0, borderColor: '#FFFFFF' },
                ]}
              />
              <TouchableOpacity
                onPress={() => {
                  setColor('#FF9600');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
                style={[
                  styles.dot,
                  { backgroundColor: '#FF9600', borderWidth: color === '#FF9600' ? 3 : 0, borderColor: '#FFFFFF' },
                ]}
              />
              <TouchableOpacity onPress={undo} style={styles.toolBtn}>
                <Undo2 size={18} color="#4B4B4B" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={clear} style={styles.toolBtn}>
                <Trash2 size={18} color="#FF4B4B" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>DONE ✓</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderBottomWidth: 3,
    borderBottomColor: '#CECECE',
  },
  pillLocked: {
    backgroundColor: '#F7F7F7',
    borderBottomColor: '#E5E5E5',
  },
  pillText: {
    fontWeight: '900',
    fontSize: 11,
    color: '#1CB0F6',
    letterSpacing: 0.3,
  },
  pillTextLocked: {
    fontWeight: '800',
    fontSize: 11,
    color: '#AFAFAF',
  },
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    position: 'absolute',
    bottom: 34,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  toolBtn: {
    padding: 6,
  },
  doneBtn: {
    backgroundColor: Colors.greenFace,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderBottomWidth: 3,
    borderBottomColor: Colors.greenLip,
    marginLeft: 4,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
