"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Copy, Check, Share2, Eye, EyeOff } from "lucide-react";

interface ShareRoomModalProps {
    roomId: string;
    password?: string | null;
}

export default function ShareRoomModal({ roomId, password }: ShareRoomModalProps) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleCopyLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyId = () => {
        navigator.clipboard.writeText(roomId);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-foreground hover:bg-foreground hover:text-background transition-colors">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share Room</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-border bg-card">
                <DialogHeader>
                    <DialogTitle>Invite Others</DialogTitle>
                    <DialogDescription>
                        Share these details to let others join this room.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Room Link */}
                    <div className="space-y-2">
                        <Label>Room Link</Label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={typeof window !== 'undefined' ? window.location.href : ''}
                                className="bg-muted font-mono text-xs"
                            />
                            <Button size="icon" variant="outline" onClick={handleCopyLink}>
                                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Room ID */}
                    <div className="space-y-2">
                        <Label>Room ID</Label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={roomId}
                                className="bg-muted font-mono text-xs"
                            />
                            <Button size="icon" variant="outline" onClick={handleCopyId}>
                                {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Password (if exists) */}
                    {password && (
                        <div className="space-y-2">
                            <Label>Password</Label>
                            <div className="flex gap-2 relative">
                                <Input
                                    readOnly
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    className="bg-muted font-mono text-xs pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
