import React from 'react';
import VideoPlayerModal from '../components/VideoPlayerModal';

export default function PlayerScreen({ route, navigation }) {
  const item = route?.params?.item;
  
  if (!item) {
    if (navigation && navigation.goBack) navigation.goBack();
    return null;
  }

  return (
    <VideoPlayerModal
      visible={true}
      item={item}
      onClose={() => {
        if (navigation && navigation.goBack) navigation.goBack();
      }}
    />
  );
}
