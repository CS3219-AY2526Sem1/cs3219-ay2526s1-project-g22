/*
AI Assistance Disclosure:
Tool: Gemini 2.5 Flash, date: 10 Oct 2025
Scope: Helped implement several functions and clarifying comments.
Author review: I validated correctness and simplicity, and fixed small implementation issues.
*/
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatCompletion {
  id: string;
  choices: {
    message: ChatMessage;
    finish_reason: string;
  }[];
}

/**
 * OpenRouter class for handling API calls.
 */
class OpenRouter {
  private apiKey: string = process.env.OPENROUTER_API_KEY || "";
  private baseUrl: string =
    process.env.OPENROUTER_URL ||
    "https://openrouter.ai/api/v1/chat/completions";

  /**
   * Creates an instance of the OpenRouter class.
   * @param apiKey - Your OpenRouter API key.
   */
  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("OpenRouter API key is required.");
    }
    this.apiKey = apiKey;
  }

  /**
   * Makes a call to the chat completions endpoint.
   * @param options - The chat completion options.
   * @returns A promise that resolves to the chat completion response.
   */
  public async chat(options: {
    model: string;
    messages: ChatMessage[];
  }): Promise<ChatCompletion> {
    const body = {
      model: options.model,
      messages: options.messages,
    };

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "My Next.js App",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenRouter API Error:", errorData);
        throw new Error(
          errorData.error?.message || "Failed to fetch from OpenRouter"
        );
      }

      return await response.json()
    } catch (error) {
      console.error("Error calling OpenRouter:", error);
      throw error;
    }
  }

  public async getChatResponse(
    userMessages: ChatMessage[]
  ): Promise<string> {
    const model = process.env.OPENROUTER_MODEL || "deepseek/deepseek-v3.2-exp";
    const systemPrompt = process.env.OPENROUTER_SYSTEM_PROMPT || "You are a helpful assistant.";
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...userMessages,
    ];

    const completion = await this.chat({
      model: model,
      messages,
    });

    return completion.choices[0].message.content;
  }
}

if (!process.env.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set.");
}

const openrouter = new OpenRouter(process.env.OPENROUTER_API_KEY);
export default openrouter;