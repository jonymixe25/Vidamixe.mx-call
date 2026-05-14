import { useEffect, useRef, useState, useCallback } from 'react';
import { socket } from '../lib/socket.js';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export function useWebRTC(roomId: string, onRoomFull?: () => void) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [remoteIsMuted, setRemoteIsMuted] = useState(false);
  const [remoteIsVideoOff, setRemoteIsVideoOff] = useState(false);

  const [isConnected, setIsConnected] = useState(false);

  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  // Initialize Media Devices
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    let mounted = true;
    
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!mounted) {
           stream.getTracks().forEach(t => t.stop());
           return;
        }
        setLocalStream(stream);
        currentStream = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        socket.connect();
        socket.emit('join-room', roomId);
      } catch (error) {
        console.error('Error accessing media devices.', error);
        alert('No se pudo acceder a la cámara y micrófono. Por favor permite el acceso y recarga la página.');
      }
    }

    initMedia();

    return () => {
      mounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
      socket.disconnect();
    };
  }, [roomId]);

  const createPeerConnection = useCallback((targetId: string) => {
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnection.current = pc;
    iceCandidatesQueue.current = [];

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      const stream = event.streams[0];
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
         socket.emit('ice-candidate', { target: targetId, candidate: event.candidate });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsConnected(true);
        // Reset remote state to defaults when connected just in case
        setRemoteIsMuted(false);
        setRemoteIsVideoOff(false);
        
        // Also inform the newly connected peer of our current state
        socket.emit('toggle-media', { target: roomId, isMuted: !localStream?.getAudioTracks()[0]?.enabled, isVideoOff: !localStream?.getVideoTracks()[0]?.enabled });

      } else if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        setIsConnected(false);
        setRemoteStream(null);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
    };

    return pc;
  }, [localStream, roomId]);


  useEffect(() => {
    if (!localStream) return;

    const handleUserConnected = async (userId: string) => {
      // New user joined, we should create an offer and send to them
      console.log('User connected, creating offer for', userId);
      const pc = createPeerConnection(userId);
      
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('offer', { target: userId, caller: socket.id, sdp: offer });
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    };

    const handleOffer = async (payload: { caller: string, sdp: any }) => {
      console.log('Received offer from', payload.caller);
      const pc = createPeerConnection(payload.caller);

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        
        // flush queue
        for (const candidate of iceCandidatesQueue.current) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
        iceCandidatesQueue.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer', { target: payload.caller, caller: socket.id, sdp: answer });
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    };

    const handleAnswer = async (payload: { caller: string, sdp: any }) => {
      console.log('Received answer from', payload.caller);
      const pc = peerConnection.current;
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          // flush queue
          for (const candidate of iceCandidatesQueue.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          iceCandidatesQueue.current = [];
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    };

    const handleIceCandidate = async (payload: { candidate: any }) => {
      const pc = peerConnection.current;
      if (pc) {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            iceCandidatesQueue.current.push(payload.candidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    socket.on('user-connected', handleUserConnected);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);

    socket.on('user-disconnected', () => {
      console.log('User disconnected');
      setIsConnected(false);
      setRemoteIsMuted(false);
      setRemoteIsVideoOff(false);
      setRemoteStream(null);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
      }
    });

    socket.on('peer-toggled-media', (payload: { isMuted?: boolean; isVideoOff?: boolean }) => {
      if (payload.isMuted !== undefined) setRemoteIsMuted(payload.isMuted);
      if (payload.isVideoOff !== undefined) setRemoteIsVideoOff(payload.isVideoOff);
    });

    socket.on('room-full', () => {
      if (onRoomFull) {
        onRoomFull();
      } else {
        alert('La sala está llena (máximo 2 personas).');
      }
    });

    return () => {
      socket.off('user-connected', handleUserConnected);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-disconnected');
      socket.off('peer-toggled-media');
      socket.off('room-full');
    };
  }, [localStream, createPeerConnection, onRoomFull]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        const muted = !audioTrack.enabled;
        setIsMuted(muted);
        socket.emit('toggle-media', { target: roomId, isMuted: muted });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        const videoOff = !videoTrack.enabled;
        setIsVideoOff(videoOff);
        socket.emit('toggle-media', { target: roomId, isVideoOff: videoOff });
      }
    }
  };

  return {
    localVideoRef,
    remoteVideoRef,
    isMuted,
    isVideoOff,
    remoteIsMuted,
    remoteIsVideoOff,
    isConnected,
    toggleMute,
    toggleVideo,
    remoteStream
  };
}
