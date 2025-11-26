export interface Room {
    id: string;
    name: string;
    type: 'text' | 'video';
    password?: string;
    host_token?: string;
    created_at: string;
}

export interface Message {
    id: string;
    room_id: string;
    content: string;
    sender_slug: string;
    created_at: string;
}

export interface User {
    id: string;
    slug: string; // Anonymous name e.g., "NeonTiger"
}

// Socket.io Events
export interface ServerToClientEvents {
    'receive-message': (message: Message) => void;
    'user-joined': (slug: string) => void;
    'user-left': (slug: string) => void;
    'user-connected': (payload: { socketId: string; slug: string }) => void;
    'user-disconnected': (userId: string) => void;
    'offer': (payload: { offer: RTCSessionDescriptionInit; to: string; from: string }) => void;
    'answer': (payload: { answer: RTCSessionDescriptionInit; to: string; from: string }) => void;
    'ice-candidate': (payload: { candidate: RTCIceCandidate; to: string; from: string }) => void;
    'room-ended': () => void;
}

export interface ClientToServerEvents {
    'join-room': (roomId: string, slug: string) => void;
    'send-message': (message: Omit<Message, 'id' | 'created_at'>) => void;
    'join-video-room': (roomId: string, userId: string) => void;
    'offer': (payload: { offer: RTCSessionDescriptionInit; to: string }) => void;
    'answer': (payload: { answer: RTCSessionDescriptionInit; to: string }) => void;
    'ice-candidate': (payload: { candidate: RTCIceCandidate; to: string }) => void;
    'end-room': (payload: { roomId: string; hostToken: string }) => void;
}
