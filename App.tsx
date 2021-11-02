import React, {FC} from 'react';
import {Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import CustomMap from './src/MapCustom';
interface AppProps {}

export const App: FC<AppProps> = () => {
  return <CustomMap />;
};
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
