import { Router } from 'express';
import { aiController } from './ai.controller';
import {authenticateUser} from "../middleware/authorization";

const router = Router();

router.post('/chat', authenticateUser, aiController.handleChat);

export default router;