import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PeerData {
    socketId: string; // Keeping 'socketId' name for compatibility, but it's now the user's slug or presence ID
    slug: string;
    stream?: MediaStream;
}

interface UseWebRTCProps {
    roomId: string;
    userId: string; // Local user's slug
}

export const useWebRTC = ({ roomId, userId }: UseWebRTCProps) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [peers, setPeers] = useState<PeerData[]>([]);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Refs
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<{ [id: string]: RTCPeerConnection }>({});
    const channelRef = useRef<RealtimeChannel | null>(null);
    const pendingCandidates = useRef<{ [id: string]: RTCIceCandidateInit[] }>({});

    // Initialize Media
    useEffect(() => {
        const initMedia = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                setLocalStream(stream);
                localStreamRef.current = stream;
            } catch (err) {
                console.error("Failed to get user media:", err);
            }
        };

        initMedia();

        return () => {
            localStreamRef.current?.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Supabase Realtime Logic
    useEffect(() => {
        if (!roomId || !userId) return;

        const channel = supabase.channel(`room:${roomId}`, {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channelRef.current = channel;

        // 1. Handle Presence (User Joining/Leaving)
        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const currentUsers = Object.keys(state);

                // Check for disconnected users
                setPeers(prev => {
                    const activeIds = new Set(currentUsers);
                    const disconnected = prev.filter(p => !activeIds.has(p.socketId) && p.socketId !== userId);

                    disconnected.forEach(p => {
                        console.log(`User disconnected: ${p.socketId}`);
                        if (peersRef.current[p.socketId]) {
                            peersRef.current[p.socketId].close();
                            delete peersRef.current[p.socketId];
                        }
                    });

                    return prev.filter(p => activeIds.has(p.socketId));
                });
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                if (key === userId) return; // Ignore self
                console.log(`User joined: ${key}`);
                setTimeout(() => initiateConnection(key), 1000);
            })
            .on('presence', { event: 'leave' }, ({ key }) => {
                console.log(`User left: ${key}`);
                if (peersRef.current[key]) {
                    peersRef.current[key].close();
                    delete peersRef.current[key];
                }
                setPeers(prev => prev.filter(p => p.socketId !== key));
            });

        // 2. Handle Signaling (Broadcast)
        channel
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                if (payload.to !== userId) return;
                handleOffer(payload);
            })
            .on('broadcast', { event: 'answer' }, async ({ payload }) => {
                if (payload.to !== userId) return;
                handleAnswer(payload);
            })
            .on('broadcast', { event: 'ice-candidate' }, async ({ payload }) => {
                if (payload.to !== userId) return;
                handleIceCandidate(payload);
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.track({ online_at: new Date().toISOString() });
            }
        });

        return () => {
            channel.unsubscribe();
            Object.values(peersRef.current).forEach(p => p.close());
            peersRef.current = {};
        };
    }, [roomId, userId]);

    // --- WebRTC Logic ---

    const createPeer = (targetId: string) => {
        if (peersRef.current[targetId]) return peersRef.current[targetId];

        const peer = new RTCPeerConnection({
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:global.stun.twilio.com:3478" },
            ],
        });

        peer.onicecandidate = (event) => {
            if (event.candidate && channelRef.current) {
                channelRef.current.send({
                    type: 'broadcast',
                    event: 'ice-candidate',
                    payload: {
                        candidate: event.candidate,
                        to: targetId,
                        from: userId
                    }
                });
            }
        };

        peer.ontrack = (event) => {
            console.log(`Received track from ${targetId}`);
            const stream = event.streams[0];
            setPeers(prev => {
                const existing = prev.find(p => p.socketId === targetId);
                if (existing) {
                    if (existing.stream?.id === stream.id) return prev;
                    return prev.map(p => p.socketId === targetId ? { ...p, stream } : p);
                }
                return [...prev, { socketId: targetId, slug: targetId, stream }];
            });
        };

        peersRef.current[targetId] = peer;

        // Add to state
        setPeers(prev => {
            if (prev.some(p => p.socketId === targetId)) return prev;
            return [...prev, { socketId: targetId, slug: targetId }];
        });

        // Add local tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current!);
            });
        }

        return peer;
    };

    const initiateConnection = async (targetId: string) => {
        console.log(`Initiating connection to ${targetId}`);
        const peer = createPeer(targetId);
        try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);

            channelRef.current?.send({
                type: 'broadcast',
                event: 'offer',
                payload: {
                    offer,
                    to: targetId,
                    from: userId
                }
            });
        } catch (err) {
            console.error("Error creating offer:", err);
        }
    };

    const handleOffer = async ({ offer, from }: { offer: RTCSessionDescriptionInit, from: string }) => {
        console.log(`Received offer from ${from}`);
        const peer = createPeer(from);
        try {
            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);

            channelRef.current?.send({
                type: 'broadcast',
                event: 'answer',
                payload: {
                    answer,
                    to: from,
                    from: userId
                }
            });

            // Process pending candidates
            const candidates = pendingCandidates.current[from];
            if (candidates) {
                candidates.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)));
                delete pendingCandidates.current[from];
            }
        } catch (err) {
            console.error("Error handling offer:", err);
        }
    };

    const handleAnswer = async ({ answer, from }: { answer: RTCSessionDescriptionInit, from: string }) => {
        console.log(`Received answer from ${from}`);
        const peer = peersRef.current[from];
        if (peer) {
            await peer.setRemoteDescription(new RTCSessionDescription(answer));
            // Process pending candidates
            const candidates = pendingCandidates.current[from];
            if (candidates) {
                candidates.forEach(c => peer.addIceCandidate(new RTCIceCandidate(c)));
                delete pendingCandidates.current[from];
            }
        }
    };

    const handleIceCandidate = async ({ candidate, from }: { candidate: RTCIceCandidateInit, from: string }) => {
        const peer = peersRef.current[from];
        if (peer) {
            if (peer.remoteDescription) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                if (!pendingCandidates.current[from]) pendingCandidates.current[from] = [];
                pendingCandidates.current[from].push(candidate);
            }
        }
    };

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(prev => !prev);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsVideoOff(prev => !prev);
        }
    };

    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        Object.values(peersRef.current).forEach(p => p.close());
        setLocalStream(null);
        setPeers([]);
        channelRef.current?.unsubscribe();
    }, []);

    return {
        localStream,
        peers,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo,
        cleanup
    };
};
