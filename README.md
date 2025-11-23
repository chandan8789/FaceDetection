# Face Authentication Demo (React Native + Redux)

A simple React Native Android app that authenticates a user by matching their face with a **pre-stored reference image**, using **custom on-device logic** (no native biometric API).

---

## Features

- **Home Screen**
  - Title: _Face Authentication Demo_
  - Button: _Start Face Authentication_
- **Camera Screen**
  - Front camera preview (VisionCamera)
  - Capture button
- **Face Authentication Flow**
  1. Start Camera from Home
  2. Capture face
  3. Detect face in:
     - Captured image
     - Reference image (`assets/reference_face.jpg`)
  4. Extract numeric face embeddings
  5. Compare embeddings via **cosine similarity**
  6. Check similarity against threshold (0.5)
- **Result Screen**
  - Success:
    - Green check icon
    - Text: _Face Verified Successfully_
  - Failure:
    - Red cross icon
    - Text: _Face Verification Failed. Try Again._
    - Retry button

State management via **Redux Toolkit**.

---

## Tech Stack / Libraries

- **React Native**
- **Redux Toolkit** + `react-redux` for global state (captured image + result)
- **Navigation**
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
- **Camera**
  - `react-native-vision-camera` – high-performance camera, `takePhoto()` for capture.
- **Face Detection**
  - `@react-native-ml-kit/face-detection` – wraps Google ML Kit face detection on-device.
- **Custom Face Recognition Logic**
  - We implement:
    - Face detection
    - Embedding extraction
    - Similarity computation
  - Completely local (no server, no OS biometric API).

---

## How Face Matching Works

1. User taps **Start Face Authentication** on Home.
2. Camera opens (front camera).
3. User taps **Capture**, app saves the photo path in Redux.
4. Result screen:
   - Loads the **reference image** from `assets/reference_face.jpg`.
   - Runs ML Kit face detection on:
     - Captured image
     - Reference image
   - For each face, we build an **embedding vector**:

     ```text
     [cxNorm, cyNorm, wNorm, hNorm, rxNorm, ryNorm, rzNorm]
     ```

     Where:
     - `cxNorm`, `cyNorm` = normalized face center
     - `wNorm`, `hNorm`   = normalized width/height
     - `rx/ry/rz`         = head Euler angles normalized to ~[-1, 1]

   - Compute **cosine similarity** between both embeddings:

     ```text
     similarity = (A · B) / (||A|| * ||B||)
     ```

   - If `similarity >= 0.5` → **Face Verified Successfully**
   - Else → **Face Verification Failed**

> Note: This is a minimal demo. In a production system you would typically replace the simple embedding with a deep model (FaceNet / ArcFace) and still use cosine similarity on the higher-dimensional vectors.

---

## Project Structure

```text
FaceAuthDemo
├── android
├── ios
├── app.json
├── index.js
├── package.json
├── assets
│   └── reference_face.jpg
└── src
    ├── AppNavigator.js
    ├── redux
    │   ├── store.js
    │   └── faceSlice.js
    ├── screens
    │   ├── HomeScreen.js
    │   ├── CameraScreen.js
    │   └── ResultScreen.js
    └── utils
        └── faceRecognition.js
