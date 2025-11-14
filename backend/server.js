// --- File: backend/server.js ---
// (Pastikan file ini sudah diperbarui seperti ini)

import 'dotenv/config'; // <-- Diubah dari require
import express from 'express'; // <-- Diubah dari require
import cors from 'cors'; // <-- Diubah dari require

// Impor rute (ESM style)
import applicationsRoutes from './routes/applications.js'; // <-- Diubah
import reportsRoutes from './routes/reports.js'; // <-- Diubah
import authRoutes from './routes/auth.js'; // <-- Diubah

// Impor db (hanya untuk cek koneksi)
import db from './config/db.js'; // <-- Diubah

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Mengizinkan Cross-Origin
app.use(express.json()); // Mem-parsing body JSON

// --- Rute API ---

// Rute aplikasi
app.use('/api/aplikasi', applicationsRoutes); // <-- Diubah
// Rute laporan
app.use('/api/laporan', reportsRoutes); // <-- Diubah
// Rute autentikasi
app.use('/api/auth', authRoutes); // <-- Diubah


// Menjalankan server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    // Coba koneksi ke DB saat startup
    // (Struktur diubah ke promise, karena db.js sekarang adalah promise pool)
    db.query('SELECT 1')
        .then(() => {
            console.log('Koneksi ke database MySQL berhasil dibuat.');
        })
        .catch((err) => {
            console.error('Koneksi ke database GAGAL:', err.message);
        });
});