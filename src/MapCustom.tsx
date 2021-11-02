import React, {useMemo, useRef, useState} from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Circle, Polygon} from 'react-native-maps';
import Canvas, {ACTION_TYPE, MAP_TYPE} from './Canvas';
const LATITUDE_DELTA = 0.009;
const LONGITUDE_DELTA = 0.009;
const CustomMap = () => {
  const mapRef = useRef(null) as any;
  const [action, setAction] = useState(null);

  const onDrawEnd = action => {
    console.log('Debug action', action);
    setAction(action);
  };

  const getActionView = () => {
    console.log(action?.payload);
    switch (action?.type) {
      case ACTION_TYPE.CIRCLE:
        return (
          <Circle
            center={action.payload.center}
            radius={action.payload.radius}
            strokeColor={'gray'}
            strokeWidth={2}
            fillColor={'rgba(18, 146, 180, 0.3)'}
          />
        );
      case ACTION_TYPE.LINE:
        return (
          <Polygon
            coordinates={action.payload.coordinates}
            strokeWidth={2}
            strokeColor={'gray'}
            fillColor={'rgba(18, 146, 180, 0.3)'}
          />
        );
      default:
        return null;
    }
  };

  const shape = useMemo(() => {
    switch (action?.type) {
      case ACTION_TYPE.CIRCLE:
        return action.payload;
      case ACTION_TYPE.LINE:
        return action.payload;
      default:
        return null;
    }
  }, [action]);
  return (
    <SafeAreaView
      edges={['bottom']}
      mode={'margin'}
      style={{
        flex: 1,
      }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 20.9800038,
          longitude: 105.7864267,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }}>
        {getActionView()}
      </MapView>
      <Canvas
        mapRef={mapRef}
        onDrawEnd={onDrawEnd}
        mapType={MAP_TYPE.GOOGLE_MAP}
      />
    </SafeAreaView>
  );
};

export default CustomMap;

const initCamera = {
  centerCoordinate: [78.92767958437497, 22.521597693584795],
  zoomLevel: 10,
  animationDuration: 0,
};

const styles = StyleSheet.create({});
