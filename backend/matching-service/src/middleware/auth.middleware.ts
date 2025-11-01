import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/supabase.service';
import { logger } from '../utils/logger';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header is missing or invalid.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabaseService.client.auth.getUser(token);

        if (error || !user) {
            logger.warn('Authentication failed: Invalid token.', { error: error?.message });
            return res.status(401).json({ message: 'Invalid or expired token.' });
        }

        req.user = { id: user.id };
        next();
    } catch (error) {
        logger.error('An unexpected error occurred in auth middleware:', error);
        return res.status(500).json({ message: 'Internal server error during authentication.' });
    }
}
