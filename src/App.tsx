/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Lobby } from './components/Lobby';
import { VideoRoom } from './components/VideoRoom';

export default function App() {
  const [roomId, setRoomId] = useState<string | null>(null);

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
