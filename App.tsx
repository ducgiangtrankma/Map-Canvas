import React, {FC} from 'react';
import {SafeAreaView, StyleSheet, Text} from 'react-native';
interface AppProps {}
export const App: FC<AppProps> = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Create</Text>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
