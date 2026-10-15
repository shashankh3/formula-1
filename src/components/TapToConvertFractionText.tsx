import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useGame } from '../context/GameContext';
import { Colors } from '../theme/colors';

interface Token {
  type: 'text' | 'pill';
  value: string;
  fraction?: string;
}

// Parses [16⅔%|+1/6] tokens
function tokenize(raw: string): Token[] {
  const out: Token[] = [];
  const re = /\[([^\]|]+)\|([^\]]+)\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    if (m.index > last) out.push({ type: 'text', value: raw.slice(last, m.index) });
    out.push({ type: 'pill', value: m[1], fraction: m[2] });
    last = m.index + m[0].length;
  }
  if (last < raw.length) out.push({ type: 'text', value: raw.slice(last) });
  return out;
}

function FlipPill({ display, fraction }: { display: string; fraction: string }) {
  const [flipped, setFlipped] = useState(false);
  const rot = useSharedValue(0);
  const { addXP } = useGame();

  const style = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rot.value}deg` }],
  }));

  const flip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    rot.value = withTiming(90, { duration: 120 });
    setTimeout(() => {
      setFlipped((f) => !f);
      rot.value = withTiming(0, { duration: 140 });
    }, 125);
    if (!flipped) {
      addXP(5);
    }
  };

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.85}>
      <Animated.View style={[styles.pill, flipped && styles.pillFlipped, style]}>
        <Text style={[styles.pillText, flipped && styles.pillTextFlipped]}>
          {flipped
            ? `${fraction} (Base=${fraction.includes('/') ? fraction.split('/')[1].replace(/[^0-9]/g, '') : fraction.replace(/[^0-9]/g, '') || '?'})`
            : display}
        </Text>
        {!flipped && <Text style={styles.tapHint}> ⚡ TAP</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function TapToConvertFractionText({ text, style }: { text: string; style?: object }) {
  const tokens = tokenize(text);
  return (
    <View style={[styles.wrap, style as object]}>
      {tokens.map((t, i) =>
        t.type === 'text' ? (
          <Text key={i} style={styles.body}>
            {t.value}
          </Text>
        ) : (
          <FlipPill key={i} display={t.value} fraction={t.fraction ?? ''} />
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  body: {
    color: '#4B4B4B',
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '700',
  },
  pill: {
    backgroundColor: '#DDF4FF',
    borderWidth: 2,
    borderColor: '#84D8FF',
    borderBottomWidth: 3,
    borderBottomColor: '#1CB0F6',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginHorizontal: 3,
    marginVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillFlipped: {
    backgroundColor: '#D7FFB8',
    borderColor: '#88E23B',
    borderBottomColor: '#58A700',
  },
  pillText: {
    color: '#1899D6',
    fontWeight: '900',
    fontSize: 15,
  },
  pillTextFlipped: {
    color: '#58A700',
  },
  tapHint: {
    color: '#1CB0F6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
