import db from '../config/db.js';
import crypto from 'crypto'; // Diperlukan untuk generate ID acak

// --- Helper Baru: Untuk generate 4-digit random ID ---
function generateAppId(length = 4) {
    // Menghasilkan ID 4 digit (Alfanumerik Kapital)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
// --- Akhir Helper ---


/**
 * @route   GET /api/submissions
 * @desc    Mengambil daftar aplikasi yang diajukan
 * @access  Private (Butuh Token)
 */
export const getSubmissions = async (req, res) => {
    try {
        // req.user diisi oleh authMiddleware
        const { id: userId, role: userRole } = req.user;

        let query = '';
        let params = [];

        if (userRole === 'Admin') {
            // Admin: Ambil SEMUA data pengajuan
            query = 'SELECT * FROM add_apps ORDER BY timestamp_buat DESC';
        } else {
            // User: Ambil HANYA data milik sendiri
            query = 'SELECT * FROM add_apps WHERE id_user_pengaju = ? ORDER BY timestamp_buat DESC';
            params.push(userId);
        }

        const [rows] = await db.query(query, params);
        
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error saat mengambil submissions:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @route   POST /api/submissions
 * @desc    Membuat pengajuan aplikasi BARU
 * @access  Private
 */
export const createSubmission = async (req, res) => {
    try {
        // Ambil ID pengguna yang login dari token
        const { id: userId } = req.user; 
        
        // Ambil data dari form
        const { nama, kategori, penjelasan, link, logo, tahun_buat, narahubung, developer } = req.body;

        // Validasi dasar
        if (!nama || !kategori || !penjelasan || !link || !developer) {
            return res.status(400).json({ message: 'Semua field wajib diisi.' });
        }

        // Masukkan ke DB, pastikan 'id_user_pengaju' diisi
        const [result] = await db.query(
            `INSERT INTO add_apps (nama, kategori, penjelasan, link, logo, tahun_buat, status_aplikasi, narahubung, developer, id_user_pengaju) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nama, kategori, penjelasan, link, logo, tahun_buat, 'Menunggu Persetujuan', narahubung, developer, userId]
        );

        res.status(201).json({ message: 'Aplikasi berhasil ditambahkan untuk ditinjau.', insertId: result.insertId });

    } catch (error) {
        console.error('Error saat membuat submission:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};


/**
 * @route   PUT /api/submissions/:id
 * @desc    Mengupdate DATA pengajuan aplikasi (Nama, Link, dll)
 * @access  Private
 */
export const updateSubmission = async (req, res) => {
    try {
        const { id: submissionId } = req.params; // ID aplikasi dari URL
        const { id: userId, role: userRole } = req.user; // Info pengguna dari token
        const { nama, kategori, penjelasan, link, logo, tahun_buat, narahubung, developer } = req.body; // Data baru

        // 1. Dapatkan aplikasi yang ada dari DB
        const [rows] = await db.query('SELECT * FROM add_apps WHERE id_add_app = ?', [submissionId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });
        }
        const app = rows[0];

        // 2. Cek Keamanan: Apakah pengguna ini boleh mengedit?
        if (userRole !== 'Admin' && app.id_user_pengaju !== userId) {
            // Jika BUKAN Admin DAN BUKAN pemilik, tolak
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik aplikasi ini.' });
        }

        // 3. PERBAIKAN LOGIKA: Cek Keamanan berdasarkan Role
        // USER hanya boleh mengedit jika status "Menunggu Persetujuan"
        if (userRole === 'User' && app.status_aplikasi !== 'Menunggu Persetujuan') {
            return res.status(400).json({ message: `Aplikasi dengan status "${app.status_aplikasi}" tidak dapat diedit lagi oleh User.` });
        }
        // Admin boleh mengedit kapan saja (tidak ada cek status untuk Admin)

        // 4. Semua lolos, lakukan UPDATE
        await db.query(
            `UPDATE add_apps SET 
                nama = ?, kategori = ?, penjelasan = ?, link = ?, logo = ?, 
                tahun_buat = ?, narahubung = ?, developer = ?
             WHERE id_add_app = ?`,
            [nama, kategori, penjelasan, link, logo, tahun_buat, narahubung, developer, submissionId]
        );
        
        // (Opsional) Jika app-nya sudah disetujui, update juga tabel applications
        if (app.status_aplikasi === 'Disetujui' && app.id_app) {
             await db.query(
                `UPDATE applications SET 
                    nama = ?, kategori = ?, penjelasan = ?, link = ?, logo = ?, 
                    tahun_buat = ?, narahubung = ?, developer = ?
                 WHERE id_app = ?`,
                [nama, kategori, penjelasan, link, logo, tahun_buat, narahubung, developer, app.id_app]
            );
        }

        res.status(200).json({ message: 'Aplikasi berhasil diperbarui.' });

    } catch (error) {
        console.error('Error saat update submission:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

/**
 * @route   DELETE /api/submissions/:id
 * @desc    Menghapus pengajuan aplikasi
 * @access  Private
 */
export const deleteSubmission = async (req, res) => {
    try {
        const { id: submissionId } = req.params;
        const { id: userId, role: userRole } = req.user;

        // 1. Dapatkan aplikasi
        const [rows] = await db.query('SELECT * FROM add_apps WHERE id_add_app = ?', [submissionId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });
        }
        const app = rows[0];

        // 2. Cek Keamanan: Hanya Admin atau Pemilik yang boleh hapus
        if (userRole !== 'Admin' && app.id_user_pengaju !== userId) {
            return res.status(403).json({ message: 'Akses ditolak. Anda bukan pemilik aplikasi ini.' });
        }
        
        // 3. PERBAIKAN LOGIKA: Cek Keamanan berdasarkan Role
        // USER hanya boleh menghapus jika status "Menunggu Persetujuan"
        if (userRole === 'User' && app.status_aplikasi !== 'Menunggu Persetujuan') {
            return res.status(400).json({ message: `Aplikasi dengan status "${app.status_aplikasi}" tidak dapat dihapus oleh User.` });
        }
        // Admin boleh menghapus kapan saja.

        // 4. Jika aplikasi sudah "Disetujui" (dan dihapus oleh Admin), nonaktifkan di tabel 'applications'
        if (app.status_aplikasi === 'Disetujui' && app.id_app) {
            await db.query('UPDATE applications SET flag_view = 0 WHERE id_app = ?', [app.id_app]);
        }

        // 5. Hapus aplikasi dari 'add_apps'
        await db.query('DELETE FROM add_apps WHERE id_add_app = ?', [submissionId]);

        res.status(200).json({ message: 'Aplikasi berhasil dihapus dari daftar pengajuan.' });

    } catch (error) {
        console.error('Error saat delete submission:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};


/**
 * @route   PATCH /api/submissions/:id/approve
 * @desc    Menyetujui/Menolak pengajuan (Admin only)
 * @access  Private (Admin)
 */
export const approveSubmission = async (req, res) => {
    // Dapatkan koneksi pool untuk transaksi
    const connection = await db.getConnection(); 
    try {
        const { id: submissionId } = req.params;
        const { role: userRole } = req.user;
        const { status_aplikasi: newStatus } = req.body; // Status baru: "Disetujui" atau "Ditolak"

        // 1. Cek Keamanan: HANYA ADMIN
        if (userRole !== 'Admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya Admin yang bisa melakukan approval.' });
        }

        // 2. Cek data aplikasi yang akan di-approve
        const [rows] = await connection.query('SELECT * FROM add_apps WHERE id_add_app = ?', [submissionId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });
        }
        
        const app = rows[0];
        const oldStatus = app.status_aplikasi;
        let currentIdApp = app.id_app; // Bisa NULL

        // --- Mulai Transaksi Database ---
        await connection.beginTransaction();

        // 3. Logika Approval berdasarkan Kasus
        
        // --- KASUS 1 & 4: Status baru adalah "Disetujui" ---
        if (newStatus === 'Disetujui') {
            
            if (!currentIdApp) {
                // KASUS 1: (Menunggu -> Disetujui) atau (Ditolak -> Disetujui, belum pernah di-approve)
                // Ini adalah persetujuan PERTAMA KALI.
                
                // 1. Generate ID baru
                currentIdApp = generateAppId(4);

                // 2. INSERT ke 'applications' (tabel publish)
                await connection.query(
                    `INSERT INTO applications (id_app, nama, kategori, penjelasan, link, logo, tahun_buat, status_aplikasi, narahubung, developer)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        currentIdApp, app.nama, app.kategori, app.penjelasan, app.link, app.logo, 
                        app.tahun_buat, 'Aktif', app.narahubung, app.developer
                    ]
                );
            } else {
                // KASUS 4: (Ditolak -> Disetujui, sudah pernah di-approve)
                // Aplikasi ini sudah ada di tabel 'applications', cukup aktifkan kembali.
                
                // 1. UPDATE 'applications' (tampilkan kembali)
                await connection.query(
                    "UPDATE applications SET flag_view = 1, status_aplikasi = 'Aktif' WHERE id_app = ?", 
                    [currentIdApp]
                );
            }
            
            // 2. UPDATE 'add_apps' (update status dan simpan id_app jika baru)
            await connection.query(
                "UPDATE add_apps SET status_aplikasi = 'Disetujui', id_app = ? WHERE id_add_app = ?",
                [currentIdApp, submissionId]
            );

        // --- KASUS 2 & 3: Status baru adalah "Ditolak" ---
        } else if (newStatus === 'Ditolak') {
            
            // 1. UPDATE 'add_apps'
            await connection.query(
                "UPDATE add_apps SET status_aplikasi = 'Ditolak' WHERE id_add_app = ?",
                [submissionId]
            );

            // 2. Jika sebelumnya "Disetujui", sembunyikan di 'applications'
            if (oldStatus === 'Disetujui' && currentIdApp) {
                await connection.query(
                    "UPDATE applications SET flag_view = 0, status_aplikasi = 'Tidak Aktif' WHERE id_app = ?", 
                    [currentIdApp]
                );
            }
        
        // --- KASUS LAIN: (Misal: kembali ke "Menunggu Persetujuan") ---
        } else {
             await connection.query(
                "UPDATE add_apps SET status_aplikasi = ? WHERE id_add_app = ?",
                [newStatus, submissionId]
            );
        }

        // --- Selesaikan Transaksi ---
        await connection.commit();
        
        res.status(200).json({ message: `Status aplikasi berhasil diubah menjadi "${newStatus}".` });

    } catch (error) {
        // Jika terjadi error, batalkan semua perubahan DB
        await connection.rollback(); 
        console.error('Error saat approve submission:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    } finally {
        // Selalu lepaskan koneksi
        if (connection) connection.release();
    }
};