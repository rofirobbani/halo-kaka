import db from '../config/db.js';

/**
 * @route   GET /api/kompilasi
 * @desc    Mengambil SEMUA aplikasi terdaftar (Admin Only)
 */
export const getAllApplications = async (req, res) => {
    try {
        // Cek Role Admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Akses ditolak. Hanya Admin.' });
        }

        const [rows] = await db.query(
            'SELECT * FROM applications ORDER BY timestamp_buat DESC'
        );
        res.status(200).json(rows);

    } catch (error) {
        console.error('Error get compilation:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   PUT /api/kompilasi/:id
 * @desc    Mengedit data aplikasi terdaftar
 */
export const updateApplication = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { nama, kategori, penjelasan, link, logo, tahun_buat, status_aplikasi, narahubung, developer } = req.body;

        // Cek exist
        const [existing] = await db.query('SELECT * FROM applications WHERE id_app = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Aplikasi tidak ditemukan.' });

        await db.query(
            `UPDATE applications SET 
                nama = ?, kategori = ?, penjelasan = ?, link = ?, logo = ?, 
                tahun_buat = ?, status_aplikasi = ?, narahubung = ?, developer = ?
             WHERE id_app = ?`,
            [nama, kategori, penjelasan, link, logo, tahun_buat, status_aplikasi, narahubung, developer, id]
        );

        // Opsi: Sinkronkan juga nama/data di tabel 'add_apps' agar konsisten (jika perlu)
        await db.query(
            `UPDATE add_apps SET nama = ?, kategori = ?, developer = ? WHERE id_app = ?`,
            [nama, kategori, developer, id]
        );

        res.status(200).json({ message: 'Data aplikasi diperbarui.' });

    } catch (error) {
        console.error('Error update compilation:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   PATCH /api/kompilasi/:id/toggle-view
 * @desc    Mengaktifkan/Menonaktifkan tampilan aplikasi (Flag View)
 */
export const toggleAppView = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { flag_view } = req.body; // Boolean (true/false atau 1/0)

        await db.query(
            'UPDATE applications SET flag_view = ? WHERE id_app = ?',
            [flag_view, id]
        );

        const statusText = flag_view ? 'ditampilkan' : 'disembunyikan';
        res.status(200).json({ message: `Aplikasi berhasil ${statusText} di Kolam Aplikasi.` });

    } catch (error) {
        console.error('Error toggle view:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   DELETE /api/kompilasi/:id
 * @desc    Menghapus aplikasi terdaftar
 */
export const deleteApplication = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;

        // Hapus dari applications
        // (Karena FK di report_apps ON DELETE CASCADE, laporan terkait akan ikut terhapus atau set null tergantung setting)
        // (Karena FK di add_apps ON DELETE SET NULL, data pengajuan asal tidak hilang, tapi putus hubungan)
        await db.query('DELETE FROM applications WHERE id_app = ?', [id]);

        res.status(200).json({ message: 'Aplikasi berhasil dihapus permanen.' });

    } catch (error) {
        console.error('Error delete compilation:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};