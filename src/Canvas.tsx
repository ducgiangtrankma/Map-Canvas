import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Platform, StyleSheet, TouchableOpacity, View} from 'react-native';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import {PanGestureHandler} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ReText} from 'react-native-redash';
import * as turf from '@turf/turf';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

export const ACTION_TYPE = {
  NONE: 'none',
  LINE: 'line',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
};

export const MAP_TYPE = {
  MAPBOX: 'mapbox',
  GOOGLE_MAP: 'google_map',
};

const Canvas = ({mapRef, mapType = MAP_TYPE.GOOGLE_MAP, onDrawEnd}) => {
  const panRef = useRef();
  const [action, setAction] = useState(ACTION_TYPE.NONE);

  // Constant
  const minusPlatform = useSharedValue(
    Platform.select({
      ios: 10.5,
      android: 15.5,
    }),
  );

  const factor = useSharedValue(0);

  // LINE
  const d = useSharedValue('');
  const memoPoints = useSharedValue([]);

  // CIRCLE
  const cx = useSharedValue(0);
  const cy = useSharedValue(0);
  const r = useSharedValue(0);

  //RECTANGLE
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  const rw = useSharedValue(0);
  const rh = useSharedValue(0);

  const bootstrap = async () => {
    if (mapType === MAP_TYPE.GOOGLE_MAP) {
      const p1 = await mapRef?.current?.coordinateForPoint({
        x: 0,
        y: 0,
      });
      const p2 = await mapRef?.current?.coordinateForPoint({
        x: 100,
        y: 0,
      });
      const c1 = turf.point([p1.longitude, p1.latitude]);
      const c2 = turf.point([p2.longitude, p2.latitude]);
      factor.value = turf.distance(c1, c2, {
        units: 'kilometers',
      });
    } else if (mapType === MAP_TYPE.MAPBOX) {
      const p1 = await mapRef?.current?.getCoordinateFromView([0, 0]);
      const p2 = await mapRef?.current?.getCoordinateFromView([100, 0]);
      const c1 = turf.point(p1);
      const c2 = turf.point(p2);
      factor.value = turf.distance(c1, c2, {
        units: 'kilometers',
      });
    }
  };

  useEffect(() => {
    d.value = '';
    memoPoints.value = [];
    cx.value = 0;
    cy.value = 0;
    r.value = 0;
    rw.value = 0;
    rh.value = 0;
    rx.value = 0;
    ry.value = 0;
    if (action === ACTION_TYPE.CIRCLE || action === ACTION_TYPE.RECTANGLE) {
      bootstrap();
    }
  }, [action]);

  const onPressAction = useCallback(
    val => () => {
      setAction(action === val ? ACTION_TYPE.NONE : val);
    },
    [action],
  );

  const onDrawLineEnd = async mPoints => {
    if (mapType === MAP_TYPE.GOOGLE_MAP) {
      const coordinates = await Promise.all(
        mPoints.map(async el => {
          return mapRef?.current?.coordinateForPoint({
            x: el.x,
            y: el.y,
          });
        }),
      );
      const points = turf.featureCollection(
        coordinates.map(el => turf.point([el.longitude, el.latitude])),
      );
      const shape = turf.convex(points, {
        concavity: 1,
      });
      onDrawEnd({
        type: ACTION_TYPE.LINE,
        payload: {
          coordinates: shape.geometry.coordinates[0].map(el => ({
            latitude: el[1],
            longitude: el[0],
          })),
        },
      });
    } else {
      const coordinates = await Promise.all(
        mPoints.map(async el => {
          return mapRef?.current?.getCoordinateFromView([el.x, el.y]);
        }),
      );
      const points = turf.featureCollection(
        coordinates.map(el => turf.point(el)),
      );
      const shape = turf.convex(points, {
        concavity: 1,
      });
      onDrawEnd({
        type: ACTION_TYPE.LINE,
        payload: shape,
      });
    }
  };

  const onDrawCircleEnd = async (mPoint, radius) => {
    if (mapType === MAP_TYPE.GOOGLE_MAP) {
      const center = await mapRef?.current?.coordinateForPoint({
        x: mPoint.x,
        y: mPoint.y,
      });
      onDrawEnd({
        type: ACTION_TYPE.CIRCLE,
        payload: {
          center,
          radius,
        },
      });
    } else {
      const center = await mapRef?.current?.getCoordinateFromView([
        mPoint.x,
        mPoint.y,
      ]);
      const shape = turf.circle(center, radius, {
        units: 'meters',
      });
      onDrawEnd({
        type: ACTION_TYPE.CIRCLE,
        payload: shape,
      });
    }
  };

  const onDrawRectEnd = async (mPoint, width, height) => {
    if (mapType === MAP_TYPE.GOOGLE_MAP) {
      const p1 = await mapRef?.current?.coordinateForPoint({
        x: mPoint.x,
        y: mPoint.y,
      });
      const p3 = await mapRef?.current?.getCoordinateFromView({
        x: mPoint.x + width,
        y: mPoint.y + height,
      });
      const p2 = {
        longitude: p1.longitude,
        latitude: p3.latitude,
      };
      const p4 = {
        longitude: p3.longitude,
        latitude: p1.latitude,
      };
      const coordinates = [p1, p2, p3, p4];
      onDrawEnd({
        type: ACTION_TYPE.LINE,
        payload: {
          coordinates,
        },
      });
    } else {
      const p1 = await mapRef?.current?.getCoordinateFromView([
        mPoint.x,
        mPoint.y,
      ]);
      const p3 = await mapRef?.current?.getCoordinateFromView([
        mPoint.x + width,
        mPoint.y + height,
      ]);
      const p2 = [p1[0], p3[1]];
      const p4 = [p3[0], p1[1]];
      const points = [p1, p2, p3, p4, p1];
      const shape = turf.polygon([points]);
      return onDrawEnd({
        type: ACTION_TYPE.LINE,
        payload: shape,
      });
    }
  };

  const panHandler = useAnimatedGestureHandler(
    {
      onStart: (evt, ctx) => {
        switch (action) {
          case ACTION_TYPE.LINE:
            memoPoints.value = [{x: evt.x, y: evt.y}];
            d.value = `M${evt.x} ${evt.y}`;
            break;
          case ACTION_TYPE.CIRCLE:
            cx.value = evt.x;
            cy.value = evt.y;
            break;
          case ACTION_TYPE.RECTANGLE:
            rx.value = evt.x;
            ry.value = evt.y;
            ctx.x = evt.x;
            ctx.y = evt.y;
            break;
          default:
            break;
        }
      },
      onActive: (evt, ctx) => {
        switch (action) {
          case ACTION_TYPE.LINE:
            d.value += ` L${evt.x} ${evt.y}`;
            memoPoints.value.push({x: evt.x, y: evt.y});
            break;
          case ACTION_TYPE.CIRCLE:
            const x = evt.translationX;
            const y = evt.translationY;
            r.value = Math.sqrt(x * x + y * y);
            break;
          case ACTION_TYPE.RECTANGLE:
            rw.value = evt.x - ctx.x;
            rh.value = evt.y - ctx.y;
            break;
          default:
            break;
        }
      },
      onEnd: (evt, ctx) => {
        switch (action) {
          case ACTION_TYPE.LINE:
            d.value += ` L${evt.x} ${evt.y}`;
            memoPoints.value.push({x: evt.x, y: evt.y});
            runOnJS(onDrawLineEnd)(memoPoints.value);
            break;
          case ACTION_TYPE.CIRCLE:
            runOnJS(onDrawCircleEnd)(
              {x: cx.value, y: cy.value},
              r.value * factor.value * 10,
            );
            break;
          case ACTION_TYPE.RECTANGLE:
            runOnJS(onDrawRectEnd)(
              {x: rx.value, y: ry.value},
              rw.value,
              rh.value,
            );
            break;
          default:
            break;
        }
        runOnJS(setAction)(ACTION_TYPE.NONE);
      },
    },
    [action],
  );

  const animatedLineProps = useAnimatedProps(() => {
    return {
      d: d.value,
    };
  });

  const animatedCircleProps = useAnimatedProps(() => {
    return {
      cx: `${cx.value}`,
      cy: `${cy.value}`,
      r: `${r.value}`,
    };
  }, [cx, cy, r]);

  const animatedRProps = useAnimatedProps(() => {
    return {
      x1: cx.value,
      y1: cy.value,
      y2: cy.value,
      x2: cx.value + r.value,
    };
  }, [cx, cy, r]);

  const animatedC1Props = useAnimatedProps(() => {
    return {
      cx: `${cx.value}`,
      cy: `${cy.value}`,
      opacity: r.value > 0 ? 1 : 0,
    };
  }, [cx, cy, r]);

  const animatedC2Props = useAnimatedProps(() => {
    return {
      cx: `${cx.value + r.value}`,
      cy: `${cy.value}`,
      opacity: r.value > 0 ? 1 : 0,
    };
  }, [cx, cy, r]);

  const animatedRTextStyle = useAnimatedStyle(() => {
    return {
      left: cx.value,
      top: cy.value - minusPlatform.value,
      width: r.value,
      opacity: r.value > 90 ? 1 : 0,
    };
  }, [cx, cy, r]);

  const animatedWTextStyle = useAnimatedStyle(() => {
    const aw = Math.abs(rw.value);
    return {
      left: rw.value < 0 ? rx.value + rw.value : rx.value,
      top: ry.value,
      width: aw,
      opacity: aw > 90 ? 1 : 0,
    };
  }, [rw, rh, rx, ry]);

  const animatedHTextStyle = useAnimatedStyle(() => {
    const ah = Math.abs(rh.value);
    return {
      left: rx.value,
      top: rh.value < 0 ? ry.value + rh.value : ry.value,
      height: ah,
      opacity: Math.abs(rh.value) > 60 ? 1 : 0,
    };
  }, [rw, rh, rx, ry]);

  const animatedRectProps = useAnimatedStyle(() => {
    return {
      x: rx.value,
      y: ry.value,
      width: rw.value,
      height: rh.value,
      opacity: rw.value !== 0 && rh.value !== 0 ? 1 : 0,
    };
  }, [rw, rh, rx, ry]);

  const distanceStr = useDerivedValue(
    () => `${((r.value * factor.value) / 100).toFixed(2)}km`,
    [r, factor],
  );
  const widthStr = useDerivedValue(
    () => `${((Math.abs(rw.value) * factor.value) / 100).toFixed(2)}km`,
    [rw, factor],
  );
  const heightStr = useDerivedValue(
    () => `${((Math.abs(rh.value) * factor.value) / 100).toFixed(2)}km`,
    [rh, factor],
  );
  return (
    <>
      <View style={StyleSheet.absoluteFillObject} pointerEvents={'box-none'}>
        {action !== ACTION_TYPE.NONE ? (
          <>
            <Svg
              style={{
                ...StyleSheet.absoluteFillObject,
              }}>
              <AnimatedPath
                animatedProps={animatedLineProps}
                fill="none"
                stroke={'gray'}
                strokeWidth={2}
                strokeLinecap={'round'}
              />
              <AnimatedCircle
                animatedProps={animatedCircleProps}
                strokeWidth={2}
                stroke={'gray'}
                fill={'gray'}
                fillOpacity={0.3}
              />
              <AnimatedLine
                animatedProps={animatedRProps}
                stroke={'gray'}
                strokeWidth="2"
                strokeDasharray={[4, 4]}
              />
              <AnimatedCircle
                animatedProps={animatedC1Props}
                r={3.5}
                fill={'gray'}
              />
              <AnimatedCircle
                animatedProps={animatedC2Props}
                r={3.5}
                fill={'gray'}
              />
              <AnimatedRect
                animatedProps={animatedRectProps}
                fill={'gray'}
                fillOpacity={0.3}
                stroke={'gray'}
                strokeWidth={2}
                strokeDasharray={[4, 4]}
              />
            </Svg>
            <PanGestureHandler
              ref={panRef}
              onGestureEvent={panHandler}
              minDist={0}>
              <Animated.View style={{flex: 1}} />
            </PanGestureHandler>
          </>
        ) : null}
        <Animated.View style={[styles.v3, animatedRTextStyle]}>
          <View style={styles.v1}>
            <ReText text={distanceStr} style={styles.t3} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.v3, styles.v5, animatedWTextStyle]}>
          <View style={styles.v1}>
            <ReText text={widthStr} style={styles.t3} />
          </View>
        </Animated.View>
        <Animated.View style={[styles.v3, styles.v4, animatedHTextStyle]}>
          <View
            style={[
              styles.v1,
              {
                // transform: [{ rotate: "90deg" }],
              },
            ]}>
            <ReText text={heightStr} style={styles.t3} />
          </View>
        </Animated.View>
      </View>
      <View style={styles.v2}>
        <ActionButton
          icon={'shape-rectangle-plus'}
          active={action === ACTION_TYPE.RECTANGLE}
          onPress={onPressAction(ACTION_TYPE.RECTANGLE)}
        />
        <ActionButton
          icon={'shape-polygon-plus'}
          active={action === ACTION_TYPE.LINE}
          onPress={onPressAction(ACTION_TYPE.LINE)}
        />
        <ActionButton
          icon={'vector-circle-variant'}
          active={action === ACTION_TYPE.CIRCLE}
          onPress={onPressAction(ACTION_TYPE.CIRCLE)}
        />
      </View>
    </>
  );
};

export default Canvas;

const ActionButton = ({icon, active = false, onPress}) => {
  return (
    <TouchableOpacity
      style={[styles.t1, {backgroundColor: active ? 'gray' : 'white'}]}
      onPress={onPress}>
      <Icon name={icon} size={18} color={active ? 'white' : 'black'} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  v1: {
    backgroundColor: 'gray',
    paddingHorizontal: 6.5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  v2: {
    position: 'absolute',
    bottom: 15,
    right: 10,
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
  },
  v3: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  v4: {
    paddingHorizontal: 10,
  },
  v5: {
    paddingVertical: 10,
  },
  t1: {
    padding: 5,
    borderRadius: 5,
  },
  t3: {
    fontSize: 13,
    color: 'white',
    padding: 0,
    margin: 0,
  },
});
