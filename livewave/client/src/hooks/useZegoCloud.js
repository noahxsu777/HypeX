import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

export default function useZegoCloud() {
  const [zegoToken, setZegoToken] = useState(null);
  const [appId, setAppId] = useState(null);
  const zegoRef = useRef(null);

  const getToken = async () => {
    try {
      const { data } = await axios.post('/api/auth/token');
      setZegoToken(data.token);
      setAppId(data.appId);
      return data;
    } catch (err) {
      console.error('Failed to get ZEGO token:', err);
      return null;
    }
  };

  const startLiveStream = async (containerEl, roomId, userId, username, role = 'Host') => {
    const tokenData = await getToken();
    if (!tokenData || !containerEl) return null;

    try {
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      const zp = ZegoUIKitPrebuilt.create(tokenData.token);
      zegoRef.current = zp;

      zp.joinRoom({
        container: containerEl,
        scenario: {
          mode: ZegoUIKitPrebuilt.LiveStreaming,
          config: {
            role: role === 'Host' ? ZegoUIKitPrebuilt.Host : ZegoUIKitPrebuilt.Audience,
          },
        },
        roomID: roomId,
        userID: String(userId),
        userName: username,
        showPreJoinView: false,
        showRoomTimer: false,
        showMyCameraToggleButton: role === 'Host',
        showMyMicrophoneToggleButton: role === 'Host',
        showAudioVideoSettingsButton: false,
        showScreenSharingButton: false,
        showTextChat: false,
        showUserList: false,
        maxUsers: 500,
        layout: 'Auto',
        showLayoutButton: false,
        onLeaveRoom: () => { console.log('Left ZEGO room'); },
      });

      return zp;
    } catch (err) {
      console.error('ZEGO SDK error:', err);
      return null;
    }
  };

  const leaveRoom = () => {
    if (zegoRef.current) {
      try { zegoRef.current.destroy(); } catch {}
      zegoRef.current = null;
    }
  };

  return { startLiveStream, leaveRoom, getToken, zegoToken, appId };
}
