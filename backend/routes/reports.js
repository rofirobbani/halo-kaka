import express from 'express';
import { 
    createLaporan, 
    getReports, 
    updateReport, 
    deleteReport, 
    updateReportStatus 
} from '../controllers/reportController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/laporan (Ambil semua/milik user)
router.get('/', authMiddleware, getReports);

// POST /api/laporan (Buat baru - biasanya dari kolam aplikasi, tapi bisa juga dari dashboard)
router.post('/', createLaporan); // Bisa diproteksi authMiddleware jika perlu id user

// PUT /api/laporan/:id (Edit)
router.put('/:id', authMiddleware, updateReport);

// DELETE /api/laporan/:id (Hapus)
router.delete('/:id', authMiddleware, deleteReport);

// PATCH /api/laporan/:id/status (Ubah Status - Admin)
router.patch('/:id/status', authMiddleware, updateReportStatus);

export default router;