// --- File: backend/controllers/authController.js ---
// (Versi lengkap dengan 4 fungsi)

import 'dotenv/config'; // Pastikan .env dimuat
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Modul bawaan Node.js untuk token
import sendEmail from '../utils/sendEmail.js';

/**
 * @route   POST /api/auth/register
 * @desc    Mendaftarkan pengguna baru
 */
export const registerUser = async (req, res) => {
    const { nama, email, satker, noHP, username, password } = req.body;

    try {
        // 1. Cek apakah username atau email sudah ada
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Username atau email sudah terdaftar.' });
        }

        // 2. Enkripsi password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Simpan pengguna baru ke database
        const [result] = await db.query(
            'INSERT INTO users (nama, email, satker, no_hp, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [nama, email, satker, noHP, username, hashedPassword, 'User'] // Role default
        );

        res.status(201).json({ message: 'Registrasi berhasil!', userId: result.insertId });

    } catch (error) {
        console.error('Error saat registrasi:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login pengguna dan mengembalikan token JWT
 */
export const loginUser = async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Cek apakah pengguna ada
        const [users] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username] // Bisa login pakai username atau email
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Kredensial tidak valid.' }); // Pesan disamarkan
        }

        const user = users[0];

        // 2. Cek password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Kredensial tidak valid.' });
        }

        // 3. Buat JSON Web Token (JWT)
        const payload = {
            user: {
                id: user.id_user,
                username: user.username,
                nama: user.nama,
                role: user.role
            }
        };

        // Pastikan JWT_SECRET ada
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new Error('JWT_SECRET tidak ditemukan di .env');
        }

        jwt.sign(
            payload,
            jwtSecret,
            { expiresIn: '1d' }, // Token berlaku 1 hari
            (err, token) => {
                if (err) throw err;
                // Kirim token dan data pengguna (tanpa password)
                res.json({
                    token,
                    user: {
                        id: user.id_user,
                        username: user.username,
                        nama: user.nama,
                        role: user.role
                    }
                });
            }
        );

        // 4. Update last_login (opsional, tapi bagus)
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id_user = ?', [user.id_user]);

    } catch (error) {
        console.error('Error saat login:', error);
        // Menangani error 'secretOrPrivateKey must have a value'
        if (error.message.includes('secretOrPrivateKey')) {
            return res.status(500).json({ message: 'Kesalahan konfigurasi server (JWT Secret).' });
        }
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Mengirim email reset password
 */
export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Cek apakah email ada
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Kita tetap kirim 200 OK agar orang tidak bisa menebak email yg terdaftar
            return res.status(200).json({ message: 'Jika email terdaftar, email reset akan dikirim.' });
        }
        const user = users[0];

        // 2. Buat Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        // Token berlaku 10 menit
        const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); 

        // 3. Simpan token ke database
        await db.query(
            'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id_user = ?',
            [hashedToken, tokenExpires, user.id_user]
        );

        // 4. Buat URL Reset
        //    PENTING: Sesuaikan 'localhost/halo-kaka-project/' dengan URL frontend Anda
        const resetURL = `http://localhost/halo-kaka-project/frontend/lupa-password.html?token=${resetToken}&email=${user.email}`;

        // 5. Buat Pesan Email (HTML)
        const message = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset Password Halo KAKA</h2>
                <p>Anda menerima email ini karena Anda (atau orang lain) meminta reset password untuk akun Anda.</p>
                <p>Silakan klik tombol di bawah untuk me-reset password Anda:</p>
                <a href="${resetURL}" style="background-color: #3486d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Reset Password
                </a>
                <p style="margin-top: 20px;">Link ini hanya berlaku selama <strong>10 menit</strong>.</p>
                <p>Jika Anda tidak meminta ini, abaikan saja email ini.</p>
            </div>
        `;

        // 6. Kirim Email
        await sendEmail({
            email: user.email,
            subject: 'Link Reset Password Halo KAKA (Berlaku 10 Menit)',
            html: message
        });
        
        // Kirim respons sukses ke frontend
        res.status(200).json({ message: 'Email reset password telah dikirim.' });

    } catch (error) {
        console.error('Error saat forgot password:', error);
        // Hapus token jika terjadi error
        // await db.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [email]);
        res.status(500).json({ message: 'Terjadi kesalahan pada server saat mengirim email.' });
    }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Me-reset password pengguna
 */
export const resetPassword = async (req, res) => {
    const { token, email, password } = req.body;

    try {
        // 1. Enkripsi token dari URL (yang dikirim frontend)
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // 2. Cari pengguna berdasarkan token DAN email DAN token belum kedaluwarsa
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
            [email, hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
        }
        const user = users[0];

        // 3. Enkripsi password baru
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Update password di database
        await db.query(
            'UPDATE users SET password = ? WHERE id_user = ?',
            [hashedPassword, user.id_user]
        );

        // 5. Hapus token reset (penting!)
        await db.query(
            'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id_user = ?',
            [user.id_user]
        );

        res.status(200).json({ message: 'Password berhasil diperbarui!' });

    } catch (error) {
        console.error('Error saat reset password:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
};