import React, { useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Copy, Check, MonitorUp } from 'lucide-react';
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
    isScreenSharing,
    remoteIsMuted,
    remoteIsVideoOff,
    isConnected,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    remoteStream
  } = useWebRTC(roomId, onLeave);

  const [copied, setCopied] = useState(false);

  const copyRoomLink = () => {
    const inviteLink = `${window.location.origin}/?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
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
          <span className="text-neutral-400 text-sm hidden sm:inline-block">Enlace de invitación:</span>
          <div className="bg-neutral-800 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-neutral-700">
            <span className="text-neutral-300 font-mono text-sm max-w-[120px] sm:max-w-xs truncate">
              {window.location.origin}/?room={roomId}
            </span>
            <button 
              onClick={copyRoomLink} 
              className="text-neutral-400 hover:text-white transition-colors"
              title="Copiar enlace"
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
          {!remoteStream && !isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                <Video className="w-10 h-10 text-neutral-600" />
              </div>
              <h2 className="text-xl font-medium text-white mb-2">Esperando al otro participante...</h2>
              <p className="text-neutral-400 max-w-md">
                Copia el enlace de invitación de la esquina superior derecha y compártelo o dales el ID <span className="font-mono text-blue-400">{roomId}</span> para que se unan.
              </p>
            </div>
          )}
          {remoteIsVideoOff && isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-neutral-900 z-10">
              <div className="w-32 h-32 rounded-full bg-neutral-800 flex items-center justify-center mb-4">
                <VideoOff className="w-12 h-12 text-neutral-600" />
              </div>
              <p className="text-neutral-400 text-lg">El invitado ha apagado su cámara</p>
            </div>
          )}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`w-full h-full object-cover ${isConnected && !remoteIsVideoOff ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}
          />
          {isConnected && (
            <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20 flex items-center gap-2">
              <span className="text-white text-sm font-medium">Invitado</span>
              {remoteIsMuted && <MicOff className="w-4 h-4 text-red-500" />}
            </div>
          )}
        </div>

        {/* Local Video (Floating / Sidebar) */}
        <div className="w-full md:w-80 lg:w-96 aspect-video md:aspect-[3/4] bg-neutral-900 rounded-2xl overflow-hidden relative shadow-xl border border-neutral-800 shrink-0 transform">
          {isVideoOff && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-800 z-10">
              <VideoOff className="w-10 h-10 text-neutral-500" />
            </div>
          )}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${!isScreenSharing ? 'scale-x-[-1]' : ''} ${!isVideoOff ? 'opacity-100' : 'opacity-0'}`}
          />
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
            {isMuted && <MicOff className="w-4 h-4 text-red-500" />}
            <span className="text-white text-sm font-medium">Tú</span>
          </div>
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
          disabled={isScreenSharing}
          className={`p-4 rounded-full transition-all duration-200 shadow-lg flex items-center justify-center ${
            isVideoOff 
              ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30' 
              : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
          } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isVideoOff ? "Activar cámara" : "Apagar cámara"}
        >
          {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <button
          id="btn-toggle-screen"
          onClick={toggleScreenShare}
          className={`p-4 rounded-full transition-all duration-200 shadow-lg flex items-center justify-center ${
            isScreenSharing 
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30' 
              : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-700'
          }`}
          title={isScreenSharing ? "Dejar de compartir pantalla" : "Compartir pantalla"}
        >
          <MonitorUp className="w-6 h-6" />
        </button>

        <div className="h-10 w-px bg-neutral-800 mx-2"></div>

        <button
          id="btn-leave-room"
          onClick={() => {
            // Remove native confirm since it might be blocked in the iframe preview
            onLeave();
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
