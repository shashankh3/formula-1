import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Radii } from '../theme/colors';

interface Props {
  title: string;
  onPress: () => void;
  faceColor?: string;
  lipColor?: string;
  textColor?: string;
  disabled?: boolean;
  small?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export default function Tactile3DButton({
  title,
  onPress,
  faceColor = Colors.greenFace,
  lipColor = Colors.greenLip,
  textColor = '#FFFFFF',
  disabled,
  small,
  style,
  textStyle,
  icon,
}: Props) {
  const ty = useSharedValue(0);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  const handleIn = () => {
    if (disabled) return;
    ty.value = withTiming(4, { duration: 40 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleOut = () => {
    if (disabled) return;
    ty.value = withSpring(0, { damping: 15, stiffness: 350 });
  };

  const borderRadius = small ? Radii.md : Radii.lg;

  const actualLipColor = disabled
    ? Colors.lockedLip
    : lipColor;
  const actualFaceColor = disabled
    ? Colors.lockedFace
    : faceColor;
  const actualTextColor = disabled
    ? Colors.textDim
    : textColor;

  return (
    <View
      style={[
        styles.lip,
        {
          backgroundColor: actualLipColor,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View style={[anim, { borderRadius }]}>
        <Pressable
          disabled={disabled}
          onPressIn={handleIn}
          onPressOut={handleOut}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            onPress();
          }}
          style={[
            styles.face,
            {
              backgroundColor: actualFaceColor,
              paddingVertical: small ? 10 : 15,
              paddingHorizontal: small ? 14 : 20,
              borderRadius,
            },
          ]}
        >
          {/* Duolingo subtle top specular shine highlight */}
          {!disabled && faceColor !== Colors.neutralFace && <View style={styles.specularShine} />}

          <View style={styles.row}>
            {icon}
            <Text
              style={[
                styles.label,
                {
                  color: actualTextColor,
                  fontSize: small ? 13 : 15,
                  letterSpacing: 0.8,
                },
                textStyle,
              ]}
            >
              {title}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lip: {
    paddingBottom: 5,
    overflow: 'hidden',
  },
  face: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  specularShine: {
    position: 'absolute',
    top: 2,
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: Radii.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontWeight: '900',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
