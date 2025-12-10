import db from '../config/db.js';

/**
 * @route   GET /api/klilink
 * @desc    Mengambil daftar link (Versi Aman)
 */
export const getKlilinks = async (req, res) => {
    try {
        let query = '';
        let params = [];
        
        const user = req.user; 

        if (user && user.role === 'Admin') {
            query = 'SELECT * FROM klilink ORDER BY timestamp_buat DESC';
        } else if (user) {
            query = 'SELECT * FROM klilink WHERE flagview = 1 OR id_user = ? ORDER BY timestamp_buat DESC';
            params.push(user.id);
        } else {
            query = 'SELECT * FROM klilink WHERE flagview = 1 ORDER BY timestamp_buat DESC';
        }

        const [rows] = await db.query(query, params);
        
        // --- PERBAIKAN KEAMANAN ---
        // Jangan kirim password & link asli ke frontend jika link diproteksi!
        const secureRows = rows.map(row => {
            // Jika user adalah Admin atau Pemilik, mereka boleh melihat data asli
            const isOwnerOrAdmin = user && (user.role === 'Admin' || user.id === row.id_user);
            
            if (row.password && !isOwnerOrAdmin) {
                return {
                    ...row,
                    link: null, // Sembunyikan URL asli
                    password: null, // Sembunyikan Password asli
                    has_password: true // Flag untuk frontend
                };
            }
            // Jika tidak diproteksi atau user berhak melihat
            return {
                ...row,
                has_password: !!row.password // true jika ada password, false jika tidak
            };
        });

        res.status(200).json(secureRows);

    } catch (error) {
        console.error('Error getting klilink:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   POST /api/klilink/access
 * @desc    Memverifikasi password dan mengambil URL asli
 */
export const accessKlilink = async (req, res) => {
    try {
        const { id_link, password_attempt } = req.body;
        
        // Ambil password dan link asli dari DB
        const [rows] = await db.query('SELECT link, password FROM klilink WHERE id_link = ?', [id_link]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Link tidak ditemukan.' });
        }
        
        const linkData = rows[0];

        // Cek kesesuaian password (Plain text sesuai request awal)
        if (linkData.password === password_attempt) {
            // Jika benar, kirim URL asli
            return res.status(200).json({ 
                success: true, 
                real_link: linkData.link 
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Password salah.' 
            });
        }

    } catch (error) {
        console.error('Error accessing link:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

// ... (Fungsi createKlilink, updateKlilink, deleteKlilink, toggleKlilink tetap sama) ...
// Pastikan untuk menyertakan fungsi-fungsi tersebut di file ini (tidak saya tulis ulang agar ringkas)
/**
 * @route   POST /api/klilink
 * @desc    Menambah link baru
 */
export const createKlilink = async (req, res) => {
    try {
        const { nama, kategori, keterangan, link, password } = req.body;
        const { id: userId, nama: userName } = req.user; 

        if (!nama || !link) {
            return res.status(400).json({ message: 'Nama dan Link wajib diisi.' });
        }

        await db.query(
            `INSERT INTO klilink (nama, kategori, keterangan, pembuat, link, password, id_user, flagview) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [nama, kategori, keterangan, userName, link, password || null, userId]
        );

        res.status(201).json({ message: 'Link berhasil ditambahkan.' });

    } catch (error) {
        console.error('Error creating klilink:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

export const updateKlilink = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, kategori, keterangan, link, password, flagview } = req.body;
        const { id: userId, role: userRole } = req.user;

        const [rows] = await db.query('SELECT * FROM klilink WHERE id_link = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Link tidak ditemukan.' });
        
        const item = rows[0];
        if (userRole !== 'Admin' && item.id_user !== userId) {
            return res.status(403).json({ message: 'Akses ditolak. Bukan milik Anda.' });
        }

        await db.query(
            `UPDATE klilink SET nama=?, kategori=?, keterangan=?, link=?, password=?, flagview=? WHERE id_link=?`,
            [nama, kategori, keterangan, link, password, flagview, id]
        );

        res.status(200).json({ message: 'Link berhasil diperbarui.' });

    } catch (error) {
        console.error('Error updating klilink:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

export const deleteKlilink = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, role: userRole } = req.user;

        const [rows] = await db.query('SELECT * FROM klilink WHERE id_link = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Link tidak ditemukan.' });
        
        const item = rows[0];
        if (userRole !== 'Admin' && item.id_user !== userId) {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }

        await db.query('DELETE FROM klilink WHERE id_link = ?', [id]);
        res.status(200).json({ message: 'Link berhasil dihapus.' });

    } catch (error) {
        console.error('Error deleting klilink:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

export const toggleKlilink = async (req, res) => {
    try {
        const { id } = req.params;
        const { flagview } = req.body;
        await db.query('UPDATE klilink SET flagview = ? WHERE id_link = ?', [flagview, id]);
        res.status(200).json({ message: 'Status tampilan diubah.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};