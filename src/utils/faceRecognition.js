// src/utils/faceRecognition.js
import FaceDetection from '@react-native-ml-kit/face-detection';

/**
 * Detect face in an image and extract facial landmarks
 * Returns face bounding box and landmark positions
 */
async function detectFace(imagePath) {
  try {
    // Detect faces in the image
    const faces = await FaceDetection.detect(imagePath, {
      landmarkMode: 'all',
      contourMode: 'all',
      performanceMode: 'accurate',
    });

    if (!faces || faces.length === 0) {
      throw new Error('No face detected in the image');
    }

    // Return the first detected face
    return faces[0];
  } catch (error) {
    console.error('Face detection error:', error);
    throw error;
  }
}

/**
 * Extract facial feature embedding from detected face
 * Creates a numerical vector representing facial features
 */
function extractFaceEmbedding(face) {
  const embedding = [];

  // Extract face bounds (normalized)
  const bounds = face.bounds || face.frame || {};
  const width = bounds.width || bounds.size?.width || 1;
  const height = bounds.height || bounds.size?.height || 1;
  const left = bounds.left || bounds.x || 0;
  const top = bounds.top || bounds.y || 0;
  
  // Face dimensions and aspect ratio
  const aspectRatio = width / height;
  embedding.push(aspectRatio);
  embedding.push(width / 1000);  // Normalized width
  embedding.push(height / 1000); // Normalized height

  // Extract landmark positions (if available)
  if (face.landmarks && face.landmarks.length > 0) {
    console.log('Processing landmarks:', face.landmarks.length);
    
    const landmarkMap = {};
    face.landmarks.forEach((landmark) => {
      landmarkMap[landmark.type] = landmark.position;
    });

    const landmarkTypes = [
      'LEFT_EYE',
      'RIGHT_EYE',
      'NOSE_BASE',
      'LEFT_MOUTH',
      'RIGHT_MOUTH',
      'LEFT_CHEEK',
      'RIGHT_CHEEK',
    ];

    landmarkTypes.forEach((type) => {
      if (landmarkMap[type]) {
        const pos = landmarkMap[type];
        // Normalize positions relative to face bounds
        const normX = (pos.x - left) / width;
        const normY = (pos.y - top) / height;
        embedding.push(normX, normY);
      } else {
        // Use distinct random values based on type instead of same defaults
        const hash = type.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
        embedding.push((hash % 100) / 100, ((hash * 7) % 100) / 100);
      }
    });

    // Calculate inter-eye distance (important feature)
    if (landmarkMap['LEFT_EYE'] && landmarkMap['RIGHT_EYE']) {
      const eyeDist = Math.sqrt(
        Math.pow(landmarkMap['RIGHT_EYE'].x - landmarkMap['LEFT_EYE'].x, 2) +
        Math.pow(landmarkMap['RIGHT_EYE'].y - landmarkMap['LEFT_EYE'].y, 2)
      );
      embedding.push(eyeDist / width); // Normalized eye distance
    } else {
      embedding.push(0.3); // Default eye distance
    }

    // Calculate nose-to-mouth distance
    if (landmarkMap['NOSE_BASE'] && landmarkMap['LEFT_MOUTH']) {
      const noseMouthDist = Math.sqrt(
        Math.pow(landmarkMap['LEFT_MOUTH'].x - landmarkMap['NOSE_BASE'].x, 2) +
        Math.pow(landmarkMap['LEFT_MOUTH'].y - landmarkMap['NOSE_BASE'].y, 2)
      );
      embedding.push(noseMouthDist / height);
    } else {
      embedding.push(0.2);
    }
  } else {
    console.log('No landmarks found, using bounds-based features');
    // If no landmarks, use bounds position and size as features
    embedding.push(left / 1000, top / 1000);
    // Add variance based on position (each image will have different values)
    for (let i = 0; i < 14; i++) {
      embedding.push(((left + top + width + height + i * 123) % 100) / 100);
    }
  }

  // Add rotation angles if available (these are important!)
  const rotX = face.headEulerAngleX !== undefined ? face.headEulerAngleX : 0;
  const rotY = face.headEulerAngleY !== undefined ? face.headEulerAngleY : 0;
  const rotZ = face.headEulerAngleZ !== undefined ? face.headEulerAngleZ : 0;
  
  embedding.push(rotX / 180);
  embedding.push(rotY / 180);
  embedding.push(rotZ / 180);

  console.log('Head angles - X:', rotX, 'Y:', rotY, 'Z:', rotZ);

  // Add smile and eye open probabilities if available
  const smileProb = face.smilingProbability !== undefined ? face.smilingProbability : -1;
  const leftEyeProb = face.leftEyeOpenProbability !== undefined ? face.leftEyeOpenProbability : -1;
  const rightEyeProb = face.rightEyeOpenProbability !== undefined ? face.rightEyeOpenProbability : -1;
  
  embedding.push(smileProb);
  embedding.push(leftEyeProb);
  embedding.push(rightEyeProb);

  console.log('Probabilities - Smile:', smileProb, 'Left Eye:', leftEyeProb, 'Right Eye:', rightEyeProb);

  return embedding;
}

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    console.warn('Invalid vectors for similarity calculation');
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate Euclidean distance between two vectors
 * Lower distance = more similar
 */
function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Main function: Match captured face with reference face
 * Returns { success: boolean, score: number }
 */
export async function matchFaces(
  capturedPath,
  referencePath,
  threshold = 0.65
) {
  try {
    console.log('========== FACE MATCHING STARTED ==========');
    console.log('Captured image:', capturedPath);
    console.log('Reference image:', referencePath);
    console.log('Threshold:', threshold);

    // Step 1: Detect faces in both images
    const [capturedFace, referenceFace] = await Promise.all([
      detectFace(capturedPath),
      detectFace(referencePath),
    ]);

    console.log('\n--- Captured Face Structure ---');
    console.log('Bounds:', capturedFace.bounds);
    console.log('Landmarks count:', capturedFace.landmarks?.length || 0);
    
    console.log('\n--- Reference Face Structure ---');
    console.log('Bounds:', referenceFace.bounds);
    console.log('Landmarks count:', referenceFace.landmarks?.length || 0);

    // Step 2: Extract embeddings from detected faces
    console.log('\n--- Extracting Captured Face Embedding ---');
    const capturedEmbedding = extractFaceEmbedding(capturedFace);
    
    console.log('\n--- Extracting Reference Face Embedding ---');
    const referenceEmbedding = extractFaceEmbedding(referenceFace);

    console.log('\nCaptured embedding:', capturedEmbedding);
    console.log('Reference embedding:', referenceEmbedding);
    console.log('Embedding lengths:', capturedEmbedding.length, 'vs', referenceEmbedding.length);

    // Check if embeddings are too similar (all same values)
    const capturedUnique = new Set(capturedEmbedding).size;
    const referenceUnique = new Set(referenceEmbedding).size;
    console.log('Unique values in captured:', capturedUnique);
    console.log('Unique values in reference:', referenceUnique);

    // Step 3: Calculate similarity score
    const similarity = cosineSimilarity(capturedEmbedding, referenceEmbedding);
    const distance = euclideanDistance(capturedEmbedding, referenceEmbedding);

    console.log('\n--- Similarity Metrics ---');
    console.log('Cosine Similarity:', similarity);
    console.log('Euclidean Distance:', distance);

    // Normalize similarity to 0-1 range
    const normalizedScore = (similarity + 1) / 2;
    
    // Check if score meets threshold
    const success = similarity >= threshold;

    console.log('\n--- Final Results ---');
    console.log('Normalized Score:', normalizedScore);
    console.log('Raw Similarity:', similarity);
    console.log('Threshold:', threshold);
    console.log('Authentication Success:', success);
    console.log('========== FACE MATCHING COMPLETED ==========\n');

    return {
      success,
      score: normalizedScore,
      similarity,
      distance,
    };
  } catch (error) {
    console.error('========== FACE MATCHING ERROR ==========');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('==========================================');
    throw error;
  }
}
