"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { Message } from "@/types";
import { Send } from "lucide-react";

interface ChatInterfaceProps {
    roomId: string;
    slug: string;
    isTextRoom?: boolean;
}

export default function ChatInterface({ roomId, slug, isTextRoom = false }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch initial messages
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .eq("room_id", roomId)
                .order("created_at", { ascending: true });

            if (data) {
                setMessages(data);
            }
        };

        fetchMessages();

        // Real-time subscription for new messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage.trim();
        setNewMessage(""); // Optimistic clear

        try {
            // 1. Save to Supabase
            const { data, error } = await supabase
                .from("messages")
                .insert([{ room_id: roomId, content, sender_slug: slug }])
                .select()
                .single();

            if (error) throw error;

            // 2. Update local state (Supabase Realtime will handle others, but we update ourselves immediately for responsiveness)
            if (data) {
                setMessages((prev) => {
                    if (prev.some(m => m.id === data.id)) return prev;
                    return [...prev, data];
                });
            }
        } catch (err) {
            console.error("Failed to send message:", err);
        }
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {!isTextRoom && (
                <div className="p-4 border-b border-border bg-card">
                    <h2 className="font-bold text-lg tracking-tight">Live Chat</h2>
                    <p className="text-xs text-muted-foreground font-mono">ID: {slug}</p>
                </div>
            )}

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {messages.map((msg) => {
                        const isMe = msg.sender_slug === slug;
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-5 py-3 text-base ${isMe
                                        ? "bg-foreground text-background rounded-br-none"
                                        : "bg-muted text-foreground border border-border rounded-bl-none"
                                        }`}
                                >
                                    <p className="leading-relaxed">{msg.content}</p>
                                </div>
                                <span className="text-xs text-muted-foreground mt-1.5 font-mono px-1">
                                    {isMe ? "You" : msg.sender_slug}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-border bg-card flex gap-3">
                <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-background border-border focus-visible:ring-foreground h-12 text-base"
                />
                <Button type="submit" size="icon" className="h-12 w-12 bg-foreground text-background hover:bg-foreground/90 rounded-lg">
                    <Send className="h-5 w-5" />
                </Button>
            </form>
        </div>
    );
}
