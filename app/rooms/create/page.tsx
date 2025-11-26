"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Video, MessageSquare, ArrowRight, Loader2 } from "lucide-react";

export default function CreateRoom() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [type, setType] = useState<"text" | "video">("text");

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        setError(null);

        try {
            // Generate a random host token
            const hostToken = crypto.randomUUID();

            const { data, error: dbError } = await supabase
                .from("rooms")
                .insert([{
                    name,
                    type,
                    password: password || null,
                    host_token: hostToken
                }])
                .select()
                .single();

            if (dbError) throw dbError;
            if (data) {
                // Store password in session storage
                if (password) {
                    sessionStorage.setItem(`room_password_${data.id}`, password);
                }
                // Store host token in session storage
                sessionStorage.setItem(`room_host_token_${data.id}`, hostToken);

                router.push(`/rooms/${data.id}`);
            }
        } catch (err: any) {
            console.error("Error creating room:", err);
            let msg = "Failed to create room.";
            if (err?.message?.includes("relation")) {
                msg = "Database tables missing. Run the SQL in README.md.";
            } else if (err?.message?.includes("API key")) {
                msg = "Invalid Supabase configuration. Check .env.local.";
            } else if (err?.message) {
                msg = err.message;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <Card className="w-full max-w-md border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl text-center">Create a Room</CardTitle>
                    <CardDescription className="text-center">
                        Start a new anonymous session.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreate}>
                    <CardContent className="space-y-6">
                        {error && (
                            <div className="p-3 text-sm text-destructive border border-destructive/50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Room Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Late Night Vibes"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="bg-input border-input"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password (Optional)</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Leave empty for public"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-input border-input"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Room Type</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${type === "text"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 bg-card"
                                        }`}
                                    onClick={() => setType("text")}
                                >
                                    <MessageSquare className="w-6 h-6" />
                                    <span className="font-medium">Text Only</span>
                                </div>
                                <div
                                    className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 transition-all ${type === "video"
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50 bg-card"
                                        }`}
                                    onClick={() => setType("video")}
                                >
                                    <Video className="w-6 h-6" />
                                    <span className="font-medium">Video + Text</span>
                                </div>
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
                                    Create & Join <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
