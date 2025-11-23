import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useDispatch } from 'react-redux';
import { setCapturedImagePath } from '../redux/faceSlice';

export default function CameraScreen({ navigation }) {
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef(null);
  const dispatch = useDispatch();

  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await requestPermission();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Camera permission is needed for face authentication.',
        );
      }
    })();
  }, [requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || !device) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        qualityPrioritization: 'balanced',
      });

      // Convert path to proper format for ML Kit
      const imagePath = photo.path.startsWith('file://')
        ? photo.path
        : `file://${photo.path}`;

      console.log('Captured image path:', imagePath);

      dispatch(setCapturedImagePath(imagePath));
      navigation.navigate('Result');
    } catch (e) {
      console.error('Capture error:', e);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  if (!device || !hasPermission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.label}>Initializing camera...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
      />

      <View style={styles.bottomOverlay}>
        <TouchableOpacity
          style={styles.captureButton}
          disabled={isCapturing}
          onPress={handleCapture}
        >
          {isCapturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.captureText}>Capture</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#fff', marginTop: 8 },
  bottomOverlay: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76,175,80,0.6)',
  },
  captureText: {
    color: '#fff',
    fontWeight: '700',
  },
});
