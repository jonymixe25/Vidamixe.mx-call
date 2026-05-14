import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Video, LogIn, Users } from 'lucide-react';

interface LobbyProps {
  onJoinRoom: (roomId: string) => void;
}

export function Lobby({ onJoinRoom }: LobbyProps) {
  const [roomId, setRoomId] = useState('');

  const handleCreateRoom = () => {
    const newRoomId = uuidv4().slice(0, 8); // short id for simplicity
    onJoinRoom(newRoomId);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full w-full bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
        
        <div className="text-center mb-8">
          <div className="mx-auto bg-blue-500/10 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Video className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Sala Privada</h1>
          <p className="text-neutral-400">Todo local. Todo seguro. Sin intermediarios.</p>
        </div>

        <div className="space-y-6">
          <button
            id="create-room-btn"
            onClick={handleCreateRoom}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
          >
            <Users className="w-5 h-5" />
            <span>Crear nueva sala</span>
          </button>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-neutral-800"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-500 text-sm">O únete a una existente</span>
            <div className="flex-grow border-t border-neutral-800"></div>
          </div>

          <form id="join-room-form" onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-neutral-400 mb-1">
                ID de la Sala
              </label>
              <input
                id="roomId"
                type="text"
                placeholder="Ej. e3a1b2c4"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-neutral-600"
                required
              />
            </div>
            <button
              id="join-room-btn"
              type="submit"
              className="w-full flex items-center justify-center space-x-2 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded-xl transition-colors duration-200"
            >
              <LogIn className="w-5 h-5" />
              <span>Unirse a la sala</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
