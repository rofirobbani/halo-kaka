import db from '../config/db.js';
import jwt from 'jsonwebtoken'; 
import 'dotenv/config'; // <-- TAMBAHAN PENTING: Memuat variabel lingkungan (.env)

/**
 * @route   GET /api/laporan
 * @desc    Mengambil daftar laporan (Filter by Role & ID User)
 */
export const getReports = async (req, res) => {
    try {
        // Pastikan req.user ada (dari authMiddleware)
        // Jika endpoint ini dipanggil tanpa middleware, req.user akan undefined
        // Tapi di routes/reports.js kita sudah pasang authMiddleware
        const { id: userId, role: userRole } = req.user;

        let query = '';
        let params = [];

        if (userRole === 'Admin') {
            // Admin: Lihat SEMUA laporan
            query = 'SELECT * FROM report_apps ORDER BY timestamp_buat DESC';
        } else {
            // User: Lihat laporan miliknya SENDIRI berdasarkan ID
            query = 'SELECT * FROM report_apps WHERE id_user_pelapor = ? ORDER BY timestamp_buat DESC';
            params.push(userId);
        }

        const [rows] = await db.query(query, params);
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error getting reports:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   POST /api/laporan
 * @desc    Membuat laporan baru (Mendukung Auth Optional)
 */
export const createLaporan = async (req, res) => {
    try {
        const { id_app, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor } = req.body;

        if (!nama_aplikasi || !jenis_laporan || !keterangan || !nama_pelapor) {
            return res.status(400).json({ message: 'Data kurang lengkap.' });
        }

        // --- LOGIKA BARU: Cek User ID dari Token (Optional) ---
        let idUserPelapor = null;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                // Pastikan JWT_SECRET ada
                if (!process.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET missing in env');
                }
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                idUserPelapor = decoded.user.id; // Ambil ID dari token
                console.log("Laporan terhubung ke User ID:", idUserPelapor); // Debugging
            } catch (err) {
                console.warn("Token tidak valid/gagal verifikasi saat buat laporan:", err.message);
                // Lanjut sebagai anonim jika token gagal
            }
        }
        // -------------------------------------------------------

        // Default status: "Baru"
        await db.query(
            'INSERT INTO report_apps (id_app, id_user_pelapor, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor, status_laporan) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id_app || 0, idUserPelapor, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor, 'Baru']
        );
        
        res.status(201).json({ message: 'Laporan berhasil dikirim!' });

    } catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   PUT /api/laporan/:id
 * @desc    Mengedit isi laporan
 */
export const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role: userRole } = req.user; // req.user dari middleware
        const { jenis_laporan, keterangan } = req.body;

        // 1. Cek data lama
        const [rows] = await db.query('SELECT * FROM report_apps WHERE id_report_app = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
        const report = rows[0];

        // 2. Cek Hak Akses (Admin atau Pemilik ID)
        if (userRole !== 'Admin') {
            // Jika id_user_pelapor ada, cek kecocokan
            if (report.id_user_pelapor !== null && report.id_user_pelapor !== userId) {
                 return res.status(403).json({ message: 'Akses ditolak. Bukan laporan Anda.' });
            }
            // Jika id_user_pelapor NULL, User biasa TIDAK BISA mengeditnya (karena dianggap anonim/milik sistem)
            if (report.id_user_pelapor === null) {
                return res.status(403).json({ message: 'Akses ditolak. Laporan ini tidak terikat dengan akun Anda.' });
            }
        }

        // 3. Cek Status (User tidak bisa edit jika sudah diproses)
        if (userRole !== 'Admin' && (report.status_laporan === 'Selesai' || report.status_laporan === 'Sedang Diperbaiki')) {
            return res.status(400).json({ message: 'Laporan yang sedang diproses/selesai tidak dapat diedit.' });
        }

        // 4. Update
        await db.query(
            'UPDATE report_apps SET jenis_laporan = ?, keterangan = ? WHERE id_report_app = ?',
            [jenis_laporan, keterangan, id]
        );

        res.status(200).json({ message: 'Laporan diperbarui.' });

    } catch (error) {
        console.error('Error updating report:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   DELETE /api/laporan/:id
 * @desc    Menghapus laporan
 */
export const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role: userRole } = req.user;

        const [rows] = await db.query('SELECT * FROM report_apps WHERE id_report_app = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
        const report = rows[0];

        // Cek Hak Akses (Admin atau Pemilik ID)
        if (userRole !== 'Admin') {
            if (report.id_user_pelapor !== null && report.id_user_pelapor !== userId) {
                 return res.status(403).json({ message: 'Akses ditolak. Bukan laporan Anda.' });
            }
            if (report.id_user_pelapor === null) {
                return res.status(403).json({ message: 'Akses ditolak.' });
            }
        }

        // Cek Status untuk User
        if (userRole !== 'Admin' && (report.status_laporan === 'Selesai' || report.status_laporan === 'Sedang Diperbaiki')) {
            return res.status(400).json({ message: 'Laporan yang sedang diproses/selesai tidak dapat dihapus.' });
        }

        await db.query('DELETE FROM report_apps WHERE id_report_app = ?', [id]);
        res.status(200).json({ message: 'Laporan dihapus.' });

    } catch (error) {
        console.error('Error deleting report:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   PATCH /api/laporan/:id/status
 * @desc    Mengubah status laporan (Admin Only)
 */
export const updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { role: userRole } = req.user;
        const { status_laporan } = req.body;

        if (userRole !== 'Admin') {
            return res.status(403).json({ message: 'Hanya Admin yang dapat mengubah status.' });
        }

        await db.query(
            'UPDATE report_apps SET status_laporan = ? WHERE id_report_app = ?',
            [status_laporan, id]
        );

        res.status(200).json({ message: `Status laporan diubah menjadi ${status_laporan}.` });

    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};