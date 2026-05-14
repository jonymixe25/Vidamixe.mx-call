/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Lobby } from './components/Lobby';
import { VideoRoom } from './components/VideoRoom';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
      // Clean up the URL so if they leave, it doesn't auto-join again on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleJoinRoom = (id: string) => {
    setRoomId(id);
  };

  const handleLeaveRoom = () => {
    setRoomId(null);
  };

  if (roomId) {
    return <VideoRoom roomId={roomId} onLeave={handleLeaveRoom} />;
  }

  return <Lobby onJoinRoom={handleJoinRoom} />;
}
