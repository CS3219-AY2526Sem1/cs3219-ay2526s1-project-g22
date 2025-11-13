import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '../config';
import { logger } from '../utils/logger';

class SupabaseService {
    public client: SupabaseClient;

    constructor() {
        if (!config.supabase.url || !config.supabase.servicekey) {
            logger.error('Supabase URL or Service Key is not provided. Cannot initialize Supabase client.');
            throw new Error('Supabase configuration missing.');
        }
        this.client = createClient(config.supabase.url, config.supabase.servicekey, {
            auth: {
                persistSession: false, // Disable local storage persistence
            },
        });
        logger.info('Supabase client initialized.');
    }
}
export const supabaseService = new SupabaseService();
