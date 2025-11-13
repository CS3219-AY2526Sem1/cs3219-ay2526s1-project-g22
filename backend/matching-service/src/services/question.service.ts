/*
AI Assistance Disclosure:
Tool: ChatGPT-5 mini, date: 01 Oct 2025
Scope: Helped implement several functions to meet the team's requirements and simplified code through refactoring and added clarifying comments.
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
export interface QuestionData {
  _id:             string;
  questionId: string;
  title: string;
  difficulty:   string;
  content:     string;
}

const API_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:6004';

// A helper function to handle fetch requests and responses
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_URL}/${url}`; // Make sure you have the full URL

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {

    const errorText = await response.text();

    console.error('Server returned an error:', response.status, errorText);

    throw new Error(`Request failed with status ${response.status}: ${errorText}`);
  }

  try {
    return await response.json() as T;
  } catch (e) {
    console.error('Failed to parse JSON response:', e);
    throw new Error('Invalid JSON response from server');
  }
}


// Get a random question based on difficulty and topics.
export async function getRandomQuestion(difficulty: string | undefined, topics: string[]): Promise<QuestionData> {
  const params = new URLSearchParams();

  switch (difficulty) {
    case 'easy':
      difficulty = 'Easy';
      break;
    case 'medium':
      difficulty = 'Medium';
      break;
    case 'hard':
      difficulty = 'Hard';
      break;
    case undefined:
      break;
    default:
      throw new Error('Invalid difficulty. Must be easy, medium, hard, or undefined.');
  }

  if (difficulty) {
    params.append('difficulty', difficulty);
  }

  topics.forEach(topic => {
    params.append('topics', topic);
  });

  const queryString = params.toString();

  const url = `questions/random${queryString ? `?${queryString}` : ''}`;

  return await fetcher<QuestionData>(url, {
    method: 'GET',
  });
}