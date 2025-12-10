import express from 'express';
import { 
    getKlilinks, 
    createKlilink, 
    updateKlilink, 
    deleteKlilink,
    toggleKlilink,
    accessKlilink // <-- IMPORT BARU
} from '../controllers/klilinkController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware Opsional
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded.user;
        } catch (e) { }
    }
    next();
};

router.get('/', optionalAuth, getKlilinks);
router.post('/', authMiddleware, createKlilink);
router.put('/:id', authMiddleware, updateKlilink);
router.delete('/:id', authMiddleware, deleteKlilink);
router.patch('/:id/toggle', authMiddleware, toggleKlilink);
router.post('/access', accessKlilink);

export default router;