import React, {FC, useRef} from 'react';
import {Platform, SafeAreaView, StyleSheet, View} from 'react-native';
import MapView, {PROVIDER_DEFAULT, PROVIDER_GOOGLE} from 'react-native-maps';
interface AppProps {}
const LATITUDE_DELTA = 0.009;
const LONGITUDE_DELTA = 0.009;
export const App: FC<AppProps> = () => {
  const mapRef = useRef(null) as any;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        provider={
          Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT
        } // remove if not using Google Maps
        style={styles.map}
        region={{
          latitude: 20.9800038,
          longitude: 105.7864267,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}
      />
    </SafeAreaView>
  );
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
