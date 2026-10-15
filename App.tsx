import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from './src/context/GameContext';
import FractionDojoScreen from './src/screens/FractionDojoScreen';
import OTAUpdateBanner from './src/components/OTAUpdateBanner';

export default function App() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <GameProvider>
          <StatusBar style="dark" />
          <View style={styles.container}>
            <OTAUpdateBanner />
            <FractionDojoScreen />
          </View>
        </GameProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
