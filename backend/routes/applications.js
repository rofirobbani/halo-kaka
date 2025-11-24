// File ini mengatur URL/endpoint untuk 'aplikasi'
import express from 'express';
import { 
    getAllAplikasi, 
    submitAplikasi, 
    incrementVisitor,
    getTopApplications // <-- IMPORT FUNGSI BARU
} from '../controllers/applicationController.js';

const router = express.Router();

// GET di http://localhost:5000/api/aplikasi/top (Harus ditaruh SEBELUM /:id agar tidak bentrok)
router.get('/top', getTopApplications);

// GET di http://localhost:5000/api/aplikasi/
router.get('/', getAllAplikasi);

// POST di http://localhost:5000/api/aplikasi/submit
router.post('/submit', submitAplikasi);

// POST di http://localhost:5000/api/aplikasi/:id/visit
router.post('/:id/visit', incrementVisitor);

export default router;