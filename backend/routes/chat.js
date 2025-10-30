import express from 'express';
import auth from '../middleware/auth.js';
import { createOrGetConversation, listConversations, listMessages, postMessage, markRead } from '../controllers/chatController.js';

const router = express.Router();

router.use(auth);
router.post('/conversations', createOrGetConversation);
router.get('/conversations', listConversations);
router.get('/conversations/:conversationId/messages', listMessages);
router.post('/conversations/:conversationId/messages', postMessage);
router.post('/conversations/:conversationId/read', markRead);

export default router;
