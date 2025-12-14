import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  downloadUrl?: string;
  error?: string;
}

export interface MediaAsset {
  uri: string;
  type: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  duration?: number; // for videos, in seconds
}

// Request permissions for camera and media library
export const requestMediaPermissions = async (): Promise<boolean> => {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
  const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  return cameraStatus === 'granted' && mediaStatus === 'granted';
};

// Pick multiple images from gallery
export const pickImages = async (maxImages: number = 10): Promise<MediaAsset[]> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: 0.8,
    selectionLimit: maxImages,
  });

  if (result.canceled || !result.assets) {
    return [];
  }

  return result.assets.map(asset => ({
    uri: asset.uri,
    type: 'image' as const,
    fileName: asset.fileName || `image_${Date.now()}.jpg`,
    fileSize: asset.fileSize,
  }));
};

// Pick single image from gallery
export const pickSingleImage = async (): Promise<MediaAsset | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: 'image',
    fileName: asset.fileName || `image_${Date.now()}.jpg`,
    fileSize: asset.fileSize,
  };
};

// Take photo with camera
export const takePhoto = async (): Promise<MediaAsset | null> => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: 'image',
    fileName: `photo_${Date.now()}.jpg`,
    fileSize: asset.fileSize,
  };
};

// Pick video from gallery
export const pickVideo = async (): Promise<MediaAsset | null> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.7,
    videoMaxDuration: 300, // 5 minutes max
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: 'video',
    fileName: asset.fileName || `video_${Date.now()}.mp4`,
    fileSize: asset.fileSize ?? undefined,
    duration: asset.duration ?? undefined,
  };
};

// Record video with camera
export const recordVideo = async (): Promise<MediaAsset | null> => {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Videos,
    allowsEditing: true,
    quality: 0.7,
    videoMaxDuration: 300, // 5 minutes max
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    type: 'video',
    fileName: `video_${Date.now()}.mp4`,
    fileSize: asset.fileSize ?? undefined,
    duration: asset.duration ?? undefined,
  };
};

// Upload a single file to Firebase Storage
export const uploadMedia = async (
  asset: MediaAsset,
  folder: string = 'news',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Read file as blob
    const response = await fetch(asset.uri);
    const blob = await response.blob();

    // Create unique filename
    const timestamp = Date.now();
    const extension = asset.type === 'image' ? 'jpg' : 'mp4';
    const fileName = `${folder}/${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;

    const storageRef = ref(storage, fileName);

    // Upload with progress tracking
    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadUrl);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleMedia = async (
  assets: MediaAsset[],
  folder: string = 'news',
  onProgress?: (totalProgress: number, currentIndex: number) => void
): Promise<string[]> => {
  const urls: string[] = [];

  for (let i = 0; i < assets.length; i++) {
    const url = await uploadMedia(
      assets[i],
      folder,
      (progress) => {
        if (onProgress) {
          const totalProgress = ((i + progress / 100) / assets.length) * 100;
          onProgress(totalProgress, i);
        }
      }
    );
    urls.push(url);
  }

  return urls;
};

// Delete a file from Firebase Storage
export const deleteMedia = async (url: string): Promise<void> => {
  try {
    // Extract path from URL
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting media:', error);
    // Don't throw - file might not exist
  }
};

// Delete multiple files
export const deleteMultipleMedia = async (urls: string[]): Promise<void> => {
  await Promise.all(urls.map(url => deleteMedia(url)));
};

// Get file size in human readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format video duration
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
