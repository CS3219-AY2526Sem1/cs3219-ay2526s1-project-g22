import path from "node:path";
import fs from 'node:fs';

const expectedEnvPath = path.resolve(__dirname, '../.env'); // Should be .../matching-service/.env

if (fs.existsSync(expectedEnvPath)) {
    console.log('.env file found at:', expectedEnvPath);
    console.log('Port:', process.env.AI_SERVICE_PORT);
} else {
    console.error('ERROR: .env file NOT found at:', expectedEnvPath);
    console.error('Please ensure your .env is in the matching-service root directory.');
}

const config = {
    port: process.env.AI_SERVICE_PORT ? parseInt(process.env.AI_SERVICE_PORT, 10) : 6020, // Ensure PORT is parsed as number
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379, // Ensure REDIS_PORT is parsed as number
    },
    supabase: {
        url: process.env.SUPABASE_URL || '',
        servicekey: process.env.SUPABASE_SERVICE_ROLE_KEY || '', // Using SERVICE_ROLE_KEY here as per your original code
    },
    openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || '',
        url: process.env.OPENROUTER_URL || 'https://openrouter.ai/api/v1/chat/completions',
    }
};

if (!config.supabase.url) { // Simplified check based on actual error
    console.error('CRITICAL ERROR: Supabase URL is still missing in config. Please check .env file.');
}
if (!config.supabase.servicekey) {
    console.warn('WARNING: Supabase service Key is missing in config. Ensure it is set if you need it.');
}

export default config;