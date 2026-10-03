import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as Sharing from 'expo-sharing';

function InternalVideoPlayer({ videoUri }) {
  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.videoView}
      player={player}
      contentFit="contain"
      nativeControls={true}
      allowsFullscreen={true}
      allowsPictureInPicture={true}
    />
  );
}

export default function VideoPlayerModal({ visible, item, onClose }) {
  if (!visible || !item || !item.fileUri) return null;

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);

  const isPhoto = item.type === 'Photo' || item.fileUri.match(/\.(jpg|jpeg|png|webp)$/i);

  const handleShare = async () => {
    try {
      await Sharing.shareAsync(item.fileUri);
    } catch (e) {
      console.log('Share error:', e.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.container}>
        {/* TOP TOOLBAR WITH SAFE AREA INSETS TOP PADDING */}
        <View style={[styles.header, { paddingTop: topPadding, height: 56 + topPadding }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            {item.title || item.name || 'Media Player'}
          </Text>

          <TouchableOpacity onPress={handleShare} style={styles.iconButton} activeOpacity={0.7}>
            <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* MEDIA DISPLAY */}
        <View style={styles.mediaContainer}>
          {isPhoto ? (
            <Image
              source={{ uri: item.fileUri }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : (
            <InternalVideoPlayer videoUri={item.fileUri} />
          )}
        </View>

        {/* FOOTER INFO & SHARE BUTTON */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity onPress={handleShare} style={styles.externalButton} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.externalButtonText}>Share / Open File</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 4,
  },
  mediaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  videoView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  footer: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingHorizontal: 16,
  },
  externalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1306C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  externalButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
