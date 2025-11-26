"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, Users } from "lucide-react";
import { useWebRTC } from "@/hooks/useWebRTC";

interface VideoGridProps {
    roomId: string;
    userId: string; // This is the local user's slug
}

export default function VideoGrid({ roomId, userId }: VideoGridProps) {
    const {
        localStream,
        peers,
        isMuted,
        isVideoOff,
        toggleMute,
        toggleVideo
    } = useWebRTC({ roomId, userId });

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const [showHttpsWarning, setShowHttpsWarning] = useState(false);

    useEffect(() => {
        // Check for secure context (HTTPS or localhost)
        if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
            setShowHttpsWarning(true);
        }
    }, []);

    // Update local video element when stream is ready
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    const totalUsers = 1 + peers.length;

    // Dynamic Grid Layout
    const getGridClass = () => {
        if (totalUsers === 1) return "grid-cols-1 max-w-4xl";
        if (totalUsers === 2) return "grid-cols-1 md:grid-cols-2 max-w-6xl";
        if (totalUsers <= 4) return "grid-cols-2 max-w-6xl";
        return "grid-cols-2 md:grid-cols-3 max-w-7xl";
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {showHttpsWarning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-center max-w-md">
                    ⚠️ Video requires HTTPS. If you are on a local network, video might not work.
                    <br />
                    <span className="text-xs opacity-90">Try using localhost or setup HTTPS.</span>
                </div>
            )}

            {/* Video Grid Container */}
            <div className="flex-1 p-4 flex items-center justify-center overflow-y-auto">
                <div className={`grid ${getGridClass()} gap-4 w-full transition-all duration-300`}>

                    {/* Local User */}
                    <div className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-sm group ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoOff ? 'opacity-0' : 'opacity-100'}`}
                        />

                        {/* Avatar Fallback */}
                        <div className={`absolute inset-0 flex items-center justify-center bg-muted transition-opacity duration-300 ${isVideoOff ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="h-24 w-24 rounded-full bg-background border-2 border-border flex items-center justify-center shadow-sm">
                                <span className="text-2xl font-bold text-foreground">You</span>
                            </div>
                        </div>

                        {/* Label */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2 shadow-sm">
                            You {isMuted && <MicOff className="h-3 w-3 text-red-400" />}
                        </div>
                    </div>

                    {/* Remote Users */}
                    {peers.map((peer) => (
                        <div key={peer.socketId} className="relative aspect-video bg-muted rounded-2xl overflow-hidden border border-border shadow-sm">
                            {peer.stream && (
                                <video
                                    autoPlay
                                    playsInline
                                    ref={(el) => {
                                        if (el) el.srcObject = peer.stream!;
                                    }}
                                    className="w-full h-full object-cover"
                                />
                            )}

                            {!peer.stream && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-muted-foreground">Connecting...</div>
                                </div>
                            )}

                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium shadow-sm">
                                {peer.slug}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating Controls */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 p-2 rounded-2xl bg-background/80 backdrop-blur-lg border border-border shadow-lg z-10">
                <Button
                    variant={isMuted ? "destructive" : "secondary"}
                    size="icon"
                    onClick={toggleMute}
                    className="h-12 w-12 rounded-xl transition-all hover:scale-105"
                >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                    variant={isVideoOff ? "destructive" : "secondary"}
                    size="icon"
                    onClick={toggleVideo}
                    className="h-12 w-12 rounded-xl transition-all hover:scale-105"
                >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>

                <div className="w-px h-8 bg-border mx-2" />

                <div className="flex items-center gap-2 px-4">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{totalUsers}</span>
                </div>
            </div>
        </div>
    );
}
