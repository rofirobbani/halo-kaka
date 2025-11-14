// --- File: backend/routes/auth.js ---
// (Versi lengkap dengan 4 endpoint)

import express from 'express';
import { 
    registerUser, 
    loginUser, 
    forgotPassword, 
    resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

// POST di http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// POST di http://localhost:5000/api/auth/login
router.post('/login', loginUser);

// POST di http://localhost:5000/api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST di http://localhost:5000/api/auth/reset-password
router.post('/reset-password', resetPassword);

export default router;