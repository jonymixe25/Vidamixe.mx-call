import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Video, LogIn, Users, Plus, Radio } from 'lucide-react';
import { socket } from '../lib/socket';

interface LobbyProps {
  onJoinRoom: (roomId: string) => void;
}

interface RoomInfo {
  id: string;
  count: number;
}

export function Lobby({ onJoinRoom }: LobbyProps) {
  const [roomId, setRoomId] = useState('');
  const [activeRooms, setActiveRooms] = useState<RoomInfo[]>([]);

  useEffect(() => {
    socket.connect();
    socket.emit('get-rooms');

    const onActiveRooms = (rooms: RoomInfo[]) => {
      setActiveRooms(rooms);
    };

    socket.on('active-rooms', onActiveRooms);

    return () => {
      socket.off('active-rooms', onActiveRooms);
    };
  }, []);

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
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center p-4">
      <div className="w-full max-w-4xl pt-12 flex flex-col lg:flex-row gap-8 items-start justify-center">
        
        {/* Left Side: Create / Join Room Form */}
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 overflow-hidden relative shrink-0">
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
              <Plus className="w-5 h-5" />
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

        {/* Right Side: Active Rooms List */}
        <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl p-6 lg:p-8 shrink-0">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-medium text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-green-500" />
              Salas Activas
            </h2>
            <span className="bg-neutral-800 text-neutral-300 text-xs font-semibold px-2.5 py-1 rounded-full">
              {activeRooms.length}
            </span>
          </div>

          <div className="space-y-3">
            {activeRooms.length === 0 ? (
              <div className="text-center py-12 px-4 border border-dashed border-neutral-800 rounded-xl">
                <Users className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-neutral-400 text-sm">No hay salas activas en este momento.</p>
                <p className="text-neutral-500 text-xs mt-1">Crea una sala para empezar.</p>
              </div>
            ) : (
              activeRooms.map((room) => (
                <div 
                  key={room.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-neutral-700 transition-colors group"
                >
                  <div className="flex flex-col">
                    <span className="text-white font-mono font-medium">{room.id}</span>
                    <span className={`text-xs mt-1 flex items-center gap-1.5 ${room.count >= 2 ? 'text-amber-500' : 'text-green-500'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {room.count} {room.count === 1 ? 'persona' : 'personas'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onJoinRoom(room.id)}
                    disabled={room.count >= 2}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      room.count >= 2 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 scale-95 group-hover:scale-100'
                    }`}
                  >
                    {room.count >= 2 ? 'Llena' : 'Unirse'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
