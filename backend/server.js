
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './config/db.js'; // Impor ini untuk menginisialisasi koneksi DB

// Impor file Rute
import applicationRoutes from './routes/applications.js';
import reportRoutes from './routes/reports.js';

// Load .env
dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// --- Middleware ---
// 1. CORS: Izinkan request dari domain lain (frontend kita)
app.use(cors());
// 2. Body Parser: Izinkan server membaca JSON dari body request
app.use(express.json());

// --- Gunakan Rute ---
// Semua rute di 'applicationRoutes' akan diawali dengan /api/aplikasi
app.use('/api/aplikasi', applicationRoutes);

// Semua rute di 'reportRoutes' akan diawali dengan /api/laporan
app.use('/api/laporan', reportRoutes);

// Endpoint dasar untuk cek server
app.get('/', (req, res) => {
  res.send('Halo KAKA Backend API sedang berjalan...');
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});