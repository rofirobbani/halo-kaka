import express from 'express';
import { 
    getSubmissions, 
    createSubmission, 
    updateSubmission,
    deleteSubmission,    
    approveSubmission    
} from '../controllers/submissionController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Rute yang sudah ada ---
// GET /api/submissions (Mengambil semua)
router.get('/', authMiddleware, getSubmissions);

// POST /api/submissions (Membuat baru)
router.post('/', authMiddleware, createSubmission);

// PUT /api/submissions/:id (Mengedit yang ada)
router.put('/:id', authMiddleware, updateSubmission);

// DELETE /api/submissions/:id (Menghapus)
router.delete('/:id', authMiddleware, deleteSubmission);

// PATCH /api/submissions/:id/approve (Khusus Admin: Setujui/Tolak)
// Kita pakai PATCH karena hanya mengubah 'status'
router.patch('/:id/approve', authMiddleware, approveSubmission);


export default router;