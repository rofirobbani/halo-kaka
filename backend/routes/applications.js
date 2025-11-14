// File ini mengatur URL/endpoint untuk 'aplikasi'
import express from 'express';
import { getAllAplikasi, submitAplikasi } from '../controllers/applicationController.js';

const router = express.Router();

// GET di http://localhost:5000/api/aplikasi/
router.get('/', getAllAplikasi);

// POST di http://localhost:5000/api/aplikasi/submit
router.post('/submit', submitAplikasi);

export default router;