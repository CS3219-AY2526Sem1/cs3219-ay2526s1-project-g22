export interface UserPreference {
    user_id: string;
    topics: string[]; // e.g., ['algorithms', 'data-structures']
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface MatchedUser {
    userId: string;
    topics: string[];
    difficulty: 'easy' | 'medium' | 'hard';
}