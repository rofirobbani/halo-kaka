import express from 'express';
import { 
    getAllApplications, 
    updateApplication, 
    toggleAppView, 
    deleteApplication 
} from '../controllers/compilationController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Semua rute diproteksi authMiddleware

// GET /api/kompilasi
router.get('/', authMiddleware, getAllApplications);

// PUT /api/kompilasi/:id (Edit Data)
router.put('/:id', authMiddleware, updateApplication);

// PATCH /api/kompilasi/:id/toggle-view (Ubah Flag View)
router.patch('/:id/toggle-view', authMiddleware, toggleAppView);

// DELETE /api/kompilasi/:id (Hapus)
router.delete('/:id', authMiddleware, deleteApplication);

export default router;