import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { resetFaceState } from '../redux/faceSlice';

export default function HomeScreen({ navigation }) {
  const dispatch = useDispatch();

  const handleStart = () => {
    dispatch(resetFaceState());
    navigation.navigate('Camera');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Face Authentication Demo</Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Start Face Authentication</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1523',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
