import openrouter, {ChatMessage} from '../services/openRouter.service';
import { Request, Response } from 'express';

class AiController {
    handleChat = async (req: Request, res: Response) => {
        const { message } = req.body || {};

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }
        const userMsg: ChatMessage[] = [{ role: 'user', content: message }];

        try {
            const response = await openrouter.getChatResponse(userMsg);
            res.status(200).json({ response });
        } catch (error) {
            console.error('Error handling chat:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
}

export const aiController = new AiController();