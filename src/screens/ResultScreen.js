import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { matchFaces } from '../utils/faceRecognition';
import { setResult } from '../redux/faceSlice';

export default function ResultScreen({ navigation }) {
  const dispatch = useDispatch();
  const { capturedImagePath, result } = useSelector(s => s.face);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!capturedImagePath) {
      Alert.alert('No Image', 'Please capture a face first.');
      navigation.replace('Home');
      return;
    }

    (async () => {
      try {
        const referenceImage = require('../../assets/umesh.jpg');
        const resolved = Image.resolveAssetSource(referenceImage).uri;

        console.log('Starting face verification...');
        const res = await matchFaces(capturedImagePath, resolved, 0.7);

        console.log('Verification result:', res);
        dispatch(setResult(res));
      } catch (error) {
        console.error('Verification error:', error);
        Alert.alert(
          'Error',
          error.message || 'Face verification failed. Please try again.',
        );
        dispatch(setResult({ success: false, score: 0 }));
      } finally {
        setLoading(false);
      }
    })();
  }, [capturedImagePath, dispatch, navigation]);

  if (loading || !result) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="green" size="large" />
        <Text style={styles.info}>Verifying face...</Text>
      </View>
    );
  }

  const { success, score } = result;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: success ? '#4caf50' : '#f44336' },
          ]}
        >
          <Text style={styles.iconText}>{success ? '✓' : '✕'}</Text>
        </View>

        <Text style={styles.title}>
          {success ? 'Face Verified Successfully' : 'Verification Failed'}
        </Text>

        <Text style={styles.scoreText}>
          Similarity Score: {score.toFixed(3)}
        </Text>

        <View style={styles.buttonsRow}>
          {!success && (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => navigation.replace('Camera')}
            >
              <Text style={styles.btnText}>Retry</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.popToTop()}
          >
            <Text style={styles.btnText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  info: { color: 'green', marginTop: 10 },
  container: {
    flex: 1,
    backgroundColor: '#0b1523',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    padding: 24,
    backgroundColor: '#182235',
    borderRadius: 16,
    alignItems: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconText: { fontSize: 40, color: '#fff' },
  title: { color: '#fff', fontSize: 18, marginBottom: 10 },
  scoreText: { color: '#b0bec5', marginBottom: 20 },
  buttonsRow: { flexDirection: 'row', gap: 12 },
  retryBtn: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
  },
  homeBtn: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 8,
  },
  btnText: { color: '#fff', fontWeight: '700' },
});
