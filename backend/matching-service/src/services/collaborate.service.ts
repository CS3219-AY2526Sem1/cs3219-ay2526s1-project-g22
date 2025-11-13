/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions and simplified code and added comments.
Author review: I checked correctness, executed tests, and refined unclear implementations while debugging minor issues.
*/
import * as jwt from 'jsonwebtoken';

export class ApiError extends Error {
    constructor(message: string, public status: number) {
        super(message);
        this.name = 'ApiError';
    }
}

// Define a type for the data you expect (great for TypeScript)
export interface CollaborationData {
    id:             string;
    interviewer_id: string;
    interviewee_id: string;
    initial_code:   string;
    created_at:     string;
    status:         string;
}

const API_URL = process.env.COLLAB_SERVICE_URL || 'http://localhost:6004/';

// A helper function to handle fetch requests and responses
async function fetcher<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...createAuthHeader(),
        ...options.headers,
    };

    const config: RequestInit = {
        ...options,
        headers,
    };

    console.log(config)

    const res = await fetch(url, config);

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Invalid JSON response' }));
        throw new ApiError(errorData.message || 'An error occurred with the API', res.status);
    }

    return res.json() as Promise<T>;
}


// Creates a new collaboration session.
// @param participants An array of user IDs.
export async function createCollaboration(userId1: string, userId2: string, question: string): Promise<CollaborationData> {
    let body = { interviewer_id: userId1, interviewee_id: userId2, question_id: question };
    if (Math.random() < 0.5){
        // swap roles
        body = { interviewer_id: userId2, interviewee_id: userId1, question_id: question};
    }

    return fetcher<CollaborationData>('sessions', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

function createAuthHeader() {
    const secretKey = process.env.SECRET_KEY;

    if (!secretKey) {
        throw new Error('SECRET_KEY is not defined in environment variables');
    }

    const payload = {
        sub: "matching-service-internal-call",
    }

    const token = jwt.sign(payload, secretKey, { expiresIn: '5m' });
    return {
        'Authorization': `Bearer ${token}`,
    };
}