import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';

interface VideoRoomProps {
  roomId: string;
  onLeave: () => void;
}

export function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isVideoOff,
    isConnected,
    toggleMute,
    toggleVideo,
    remoteStream
  } = useWebRTC(roomId);

  const [copied, setCopied] = useState(false);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-white flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          Sala Segura
        </h1>
        
        <div className="flex items-center gap-3">
          <span className="text-neutral-400 text-sm hidden sm:inline-block">ID de sala:</span>
          <div className="bg-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-neutral-700">
            <span className="text-white font-mono text-sm">{roomId}</span>
            <button 
              onClick={copyRoomId} 
              className="text-neutral-400 hover:text-white transition-colors"
              title="Copiar ID"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 w-full max-w-6xl p-4 sm:p-8 flex flex-col md:flex-row gap-4 items-stretch justify-center relative">
        
        {/* Remote Video (Main) */}
        <div className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden relative border border-neutral-800 shadow-2xl">
          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                <Video className="w-10 h-10 text-neutral-600" />
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Esperando al otro participante...</h2>
              <p className="text-neutral-400 max-w-md">
                Comparte el ID de la sala <span className="font-mono text-blue-400">{roomId}</span> con tu invitado para que pueda unirse a la videollamada.
              </p>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isConnected ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          />
          {isConnected && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-white text-sm font-medium">Invitado</span>
            </div>
          )}
        </div>

        {/* Local Video (Floating / Sidebar) */}
        <div className="w-full md:w-80 lg:w-96 aspect-video md:aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden relative shadow-xl border border-neutral-800 shrink-0 transform scale-x-[-1]">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 scale-x-[-1]">
            <span className="text-white text-sm font-medium">Tú</span>
          </div>
          
          {(isMuted || isVideoOff) && (
            <div className="absolute top-4 right-4 flex gap-2 scale-x-[-1]">
              {isMuted && <div className="bg-red-500 text-white p-1.5 rounded-md shadow-md"><MicOff className="w-4 h-4" /></div>}
              {isVideoOff && <div className="bg-red-500 text-white p-1.5 rounded-md shadow-md"><VideoOff className="w-4 h-4" /></div>}
            </div>
          )}
        </div>

      </div>

      {/* Controls Bar */}
      <div id="video-controls" className="w-full bg-neutral-900 border-t border-neutral-800 p-6 flex justify-center items-center gap-6">
        <button
          id="btn-toggle-mute"
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all duration-200 shadow-lg flex items-center justify-center ${
            isMuted 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
          }`}
          title={isMuted ? "Activar micrófono" : "Silenciar micrófono"}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          id="btn-toggle-video"
          onClick={toggleVideo}
          className={`p-4 rounded-full transition-all duration-200 shadow-lg flex items-center justify-center ${
            isVideoOff 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
          }`}
          title={isVideoOff ? "Activar cámara" : "Apagar cámara"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <div className="h-10 w-px bg-neutral-800 mx-2"></div>

        <button
          id="btn-leave-room"
          onClick={() => {
            if (confirm('¿Seguro que deseas salir de la sala?')) {
              onLeave();
            }
          }}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-all duration-200 shadow-lg border border-red-500 flex items-center justify-center"
          title="Colgar"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}
