import db from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * @route   GET /api/users
 * @desc    Mengambil semua data pengguna (Admin Only)
 */
export const getUsers = async (req, res) => {
    try {
        // Pastikan yang request adalah Admin
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Akses ditolak.' });
        }

        // Ambil semua user, urutkan dari yang terbaru
        // PENTING: Jangan kirim password hash ke frontend demi keamanan
        const [rows] = await db.query(
            'SELECT id_user, nama, email, satker, no_hp, username, role, last_login, timestamp_buat FROM users ORDER BY timestamp_buat DESC'
        );
        
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error getting users:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   POST /api/users
 * @desc    Menambah pengguna baru (Admin Only)
 */
export const createUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { nama, email, satker, no_hp, username, password, role } = req.body;

        if (!nama || !email || !username || !password) {
            return res.status(400).json({ message: 'Data wajib tidak lengkap.' });
        }

        // Cek duplikat
        const [existing] = await db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username atau Email sudah digunakan.' });

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            'INSERT INTO users (nama, email, satker, no_hp, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nama, email, satker, no_hp, username, hashedPassword, role || 'User']
        );

        res.status(201).json({ message: 'Pengguna berhasil ditambahkan.' });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   PUT /api/users/:id
 * @desc    Mengedit pengguna (Admin Only)
 */
export const updateUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });

        const { id } = req.params;
        const { nama, email, satker, no_hp, username, password, role } = req.body;

        // Cek apakah user ada
        const [existing] = await db.query('SELECT * FROM users WHERE id_user = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });

        // Siapkan query update dinamis (karena password opsional saat edit)
        let query = 'UPDATE users SET nama=?, email=?, satker=?, no_hp=?, username=?, role=?';
        let params = [nama, email, satker, no_hp, username, role];

        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password=?';
            params.push(hashedPassword);
        }

        query += ' WHERE id_user=?';
        params.push(id);

        await db.query(query, params);
        res.status(200).json({ message: 'Data pengguna diperbarui.' });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};

/**
 * @route   DELETE /api/users/:id
 * @desc    Menghapus pengguna (Admin Only)
 */
export const deleteUser = async (req, res) => {
    try {
        if (req.user.role !== 'Admin') return res.status(403).json({ message: 'Akses ditolak.' });
        const { id } = req.params;

        // Mencegah admin menghapus dirinya sendiri (opsional tapi disarankan)
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Anda tidak dapat menghapus akun sendiri.' });
        }

        await db.query('DELETE FROM users WHERE id_user = ?', [id]);
        res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Terjadi kesalahan server.' });
    }
};