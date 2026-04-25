export interface Comment {
    id: string;
    user: {
        id: string;
        name: string;
        username: string;
        profileImage?: string;
        showRealName: boolean;
    };
    content: string;
    timestamp: string;
}

export interface Post {
    id: string;
    user: {
        id: string;
        name: string;
        username: string;
        profileImage?: string;
        showRealName: boolean;
    };
    content: string;
    image?: string;
    likes: number;
    dislikes?: number;
    comments: Comment[] | number;
    commentsCount?: number;
    shares: number;
    saves?: number;
    views?: number;
    ctr?: number;
    timestamp: string;
    lastEngagementAt?: string;
    type: 'text' | 'image' | 'video' | 'mixed';
    battleId?: string | null;
    sharedFromPostId?: string;
    sharedFromUser?: {
        name: string;
        username: string;
        profileImage?: string | null;
    };
    isLiked?: boolean;
    isDisliked?: boolean;
    status?: string;
}
