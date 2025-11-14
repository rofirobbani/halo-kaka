// File ini mengatur URL/endpoint untuk 'laporan'
import express from 'express';
import { createLaporan } from '../controllers/reportController.js';

const router = express.Router();

// POST di http://localhost:5000/api/laporan/
router.post('/', createLaporan);

export default router;