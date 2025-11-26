"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ChatInterface from "@/components/ChatInterface";
import VideoGrid from "@/components/VideoGrid";
import ShareRoomModal from "@/components/ShareRoomModal";
import { supabase } from "@/lib/supabase";
import { Room } from "@/types";
import { Loader2, Lock, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RoomPage() {
    const { roomId } = useParams() as { roomId: string };
    const [room, setRoom] = useState<Room | null>(null);
    const [slug, setSlug] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [authError, setAuthError] = useState("");
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isHost, setIsHost] = useState(false);

    useEffect(() => {
        // Persist identity (slug) across refreshes
        const storedSlug = sessionStorage.getItem(`user_slug_${roomId}`);
        if (storedSlug) {
            setSlug(storedSlug);
        } else {
            const randomSlug = `Anon${Math.floor(Math.random() * 10000)}`;
            sessionStorage.setItem(`user_slug_${roomId}`, randomSlug);
            setSlug(randomSlug);
        }

        // Check if Host
        const hostToken = sessionStorage.getItem(`room_host_token_${roomId}`);
        if (hostToken) {
            setIsHost(true);
        }

        const fetchRoom = async () => {
            if (!roomId) return;

            const { data, error } = await supabase
                .from("rooms")
                .select("*")
                .eq("id", roomId)
                .single();

            if (data) {
                setRoom(data);
                if (!data.password) {
                    setIsAuthenticated(true);
                } else {
                    const storedPassword = sessionStorage.getItem(`room_password_${data.id}`);
                    if (storedPassword === data.password) {
                        setIsAuthenticated(true);
                    }
                }
            } else {
                console.error("Room not found");
            }
            setLoading(false);
        };

        fetchRoom();
    }, [roomId]);

    useEffect(() => {
        // Listen for Room Deletion (End Room)
        const channel = supabase
            .channel(`room_status:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
                () => {
                    alert("The host has ended this room.");
                    window.location.href = "/";
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (room && room.password === passwordInput) {
            setIsAuthenticated(true);
            sessionStorage.setItem(`room_password_${room.id}`, passwordInput);
            setAuthError("");
        } else {
            setAuthError("Incorrect password");
        }
    };

    const handleEndRoom = async () => {
        if (!confirm("Are you sure you want to end this room? This will kick everyone out and delete the room.")) return;

        const hostToken = sessionStorage.getItem(`room_host_token_${roomId}`);
        if (hostToken) {
            // Delete room directly via Supabase
            // Note: RLS must allow delete if we have the host_token, but currently we rely on client-side check + standard delete
            // Ideally we'd use a secure RPC or Edge Function, but for now we'll try direct delete.
            // If RLS blocks it, we might need a quick policy update.
            const { error } = await supabase.from('rooms').delete().eq('id', roomId);
            if (error) {
                console.error("Failed to end room:", error);
                alert("Failed to end room. You might not have permission.");
            }
        }
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!room) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background text-foreground">
                <h1 className="text-2xl">Room not found</h1>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background p-4">
                <Card className="w-full max-w-md border-border">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2">
                            <Lock className="h-5 w-5" /> Locked Room
                        </CardTitle>
                        <CardDescription className="text-center">
                            This room requires a password to enter.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAuth} className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Enter password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="bg-input border-input"
                            />
                            {authError && <p className="text-sm text-destructive">{authError}</p>}
                            <Button type="submit" className="w-full">Unlock</Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // TEXT ROOM LAYOUT
    if (room.type === 'text') {
        return (
            <div className="flex h-screen bg-background text-foreground flex-col items-center">
                <header className="h-14 w-full border-b border-border flex items-center px-4 justify-between bg-card z-20 max-w-4xl">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg truncate">{room.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="hidden sm:inline">Live</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {isHost && (
                            <Button variant="destructive" size="sm" onClick={handleEndRoom}>
                                End Room
                            </Button>
                        )}
                        <ShareRoomModal roomId={room.id} password={room.password} />
                    </div>
                </header>

                <div className="flex-1 w-full max-w-4xl border-x border-border bg-card shadow-sm">
                    <ChatInterface roomId={room.id} slug={slug} isTextRoom={true} />
                </div>
            </div>
        );
    }

    // VIDEO ROOM LAYOUT
    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden flex-col md:flex-row">
            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-card z-20">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold text-lg truncate">{room.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span className="hidden sm:inline">Live</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isHost && (
                            <Button variant="destructive" size="sm" onClick={handleEndRoom}>
                                End Room
                            </Button>
                        )}
                        <ShareRoomModal roomId={room.id} password={room.password} />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            {isChatOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>
                    </div>
                </header>

                <VideoGrid roomId={room.id} userId={slug} />
            </div>

            <div className="hidden md:block w-80 lg:w-96 flex-none z-10 border-l border-border">
                <ChatInterface roomId={room.id} slug={slug} />
            </div>

            {isChatOpen && (
                <div className="absolute inset-0 z-50 md:hidden bg-background flex flex-col">
                    <header className="h-14 border-b border-border flex items-center px-4 justify-between bg-card">
                        <h2 className="font-bold">Chat</h2>
                        <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </header>
                    <div className="flex-1 overflow-hidden">
                        <ChatInterface roomId={room.id} slug={slug} />
                    </div>
                </div>
            )}
        </div>
    );
}
