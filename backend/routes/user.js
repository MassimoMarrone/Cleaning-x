import express from 'express';
import { getUsers, registerUser, updateUserRole } from '../controllers/userController.js';
import auth from '../middleware/auth.js';
import admin from '../middleware/admin.js';

const router = express.Router();

router.get('/', auth, admin, getUsers);
router.post('/register', registerUser);
router.patch('/:id/role', auth, admin, updateUserRole);

export default router;
