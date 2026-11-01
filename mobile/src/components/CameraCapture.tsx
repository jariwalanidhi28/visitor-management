import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as ImageManipulator from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";

interface CameraCaptureProps {
  title?: string;
  onPhotoConfirmed: (photoUri: string, photoBase64?: string) => void;
  onCancel: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  title = "Live Verification Photo",
  onPhotoConfirmed,
  onCancel,
}) => {
  const [facing, setFacing] = useState<CameraType>("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedBase64, setCapturedBase64] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null);

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Initializing camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="camera-outline" size={64} color="#64748B" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionDesc}>
          VisitorFlow requires access to your device camera to capture live
          attendance verification selfies. Photos from gallery are strictly disabled.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleCameraFacing = () => {
    setFacing((current) => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (photo?.uri) {
        // Compress and optimize image to ~800px width, 0.75 JPEG, and include base64
        const manipulated = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 800 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG, base64: true }
        );
        setCapturedPhoto(manipulated.uri);
        setCapturedBase64(manipulated.base64 || "");
      }
    } catch (err: any) {
      Alert.alert("Camera Error", err.message || "Failed to capture photo");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (capturedPhoto) {
      onPhotoConfirmed(capturedPhoto, capturedBase64);
    }
  };

  const handleRetake = () => {
    setCapturedPhoto(null);
    setCapturedBase64("");
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <TouchableOpacity
          onPress={toggleCameraFacing}
          disabled={Boolean(capturedPhoto)}
          style={[styles.iconButton, Boolean(capturedPhoto) && { opacity: 0 }]}
        >
          <Ionicons name="camera-reverse" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Viewfinder / Preview */}
      <View style={styles.previewContainer}>
        {capturedPhoto ? (
          <Image source={{ uri: capturedPhoto }} style={styles.previewImage} />
        ) : (
          <>
            <CameraView
              style={styles.camera}
              facing={facing}
              ref={cameraRef}
            />
            {/* Guide overlay rendered on top using absolute positioning */}
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.faceGuide} />
              <Text style={styles.guideText}>
                Center your face in the frame
              </Text>
            </View>
          </>
        )}

        {isProcessing && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.processingText}>Processing photo...</Text>
          </View>
        )}
      </View>

      {/* Bottom Controls */}
      <View style={styles.controls}>
        {capturedPhoto ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleRetake}
            >
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Confirm Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureRow}>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
              disabled={isProcessing}
            >
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
    marginTop: 16,
    textAlign: "center",
  },
  permissionDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: "#0F172A",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 8,
  },
  previewContainer: {
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  faceGuide: {
    width: 240,
    height: 300,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 120,
    borderStyle: "dashed",
  },
  guideText: {
    color: "#FFFFFF",
    fontSize: 13,
    marginTop: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  processingText: {
    color: "#FFFFFF",
    marginTop: 10,
    fontSize: 14,
  },
  controls: {
    height: 120,
    backgroundColor: "#0F172A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  captureRow: {
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  captureInnerCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#2563EB",
  },
  actionRow: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
  },
  retakeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#475569",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  secondaryButton: {
    paddingVertical: 12,
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  secondaryButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
});
