import express from 'express';
import { register, login, getProfile, switchRole } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile);
router.put('/switch-role', switchRole);

export default router;
