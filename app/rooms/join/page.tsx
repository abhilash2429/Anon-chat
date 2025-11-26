"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { ArrowRight, Loader2, Lock } from "lucide-react";

export default function JoinRoom() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roomId, setRoomId] = useState("");
    const [password, setPassword] = useState("");

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomId.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Check if room exists and requires password
            const { data: room, error: roomError } = await supabase
                .from("rooms")
                .select("id, password")
                .eq("id", roomId)
                .single();

            if (roomError || !room) {
                throw new Error("Room not found");
            }

            if (room.password && room.password !== password) {
                throw new Error("Incorrect password");
            }

            // Store password for session access
            if (room.password) {
                sessionStorage.setItem(`room_password_${room.id}`, password);
            }

            router.push(`/rooms/${room.id}`);
        } catch (err: any) {
            console.error("Error joining room:", err);
            setError(err.message || "Failed to join room");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Join Room</CardTitle>
                    <CardDescription className="text-center">
                        Enter the Room ID to connect.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleJoin}>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-destructive border border-destructive/50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="roomId">Room ID</Label>
                            <Input
                                id="roomId"
                                placeholder="e.g. 550e8400-e29b..."
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className="bg-input border-input font-mono"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password (If required)</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Room Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-input border-input pl-9"
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Join Room <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
