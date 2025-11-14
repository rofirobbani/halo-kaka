// --- File: backend/controllers/authController.js ---
// (Versi lengkap dengan 4 endpoint + perbaikan dotenv)

// Perbaikan: Muat dotenv di sini agar 'process.env.JWT_SECRET' terbaca
import 'dotenv/config'; 
import db from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // Modul bawaan Node.js untuk token acak
import sendEmail from '../utils/sendEmail.js'; // Impor utilitas email

/**
 * @route   POST /api/auth/register
 * @desc    Mendaftarkan pengguna baru
 */
export const registerUser = async (req, res) => {
  try {
    const { nama, email, satker, noHP, username, password } = req.body;

    // 1. Validasi Input
    if (!nama || !email || !username || !password) {
      return res.status(400).json({ message: 'Nama, email, username, dan password wajib diisi.' });
    }

    // 2. Cek apakah username atau email sudah ada
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username atau email sudah terdaftar.' });
    }

    // 3. Enkripsi (Hash) Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Simpan pengguna baru ke database
    const [result] = await db.query(
      'INSERT INTO users (nama, email, satker, no_hp, username, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nama, email, satker, noHP, username, hashedPassword, 'User'] // Role default adalah 'User'
    );

    res.status(201).json({ message: 'Registrasi berhasil!', userId: result.insertId });

  } catch (error) {
    console.error('Error saat registrasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};


/**
 * @route   POST /api/auth/login
 * @desc    Login pengguna dan mengembalikan JWT
 */
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. Validasi input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi.' });
    }

    // 2. Cari pengguna berdasarkan username atau email
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    const user = rows[0];

    // 3. Cek apakah pengguna ada
    if (!user) {
      return res.status(400).json({ message: 'Kredensial tidak valid (username/email salah).' });
    }

    // 4. Cek password (bandingkan password input dengan hash di DB)
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Kredensial tidak valid (password salah).' });
    }

    // 5. Update 'last_login' (opsional tapi bagus)
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id_user = ?', [user.id_user]);

    // 6. Buat JSON Web Token (JWT)
    const payload = {
      user: {
        id: user.id_user,
        nama: user.nama,
        username: user.username,
        role: user.role // KIRIM ROLE KE FRONTEND
      }
    };
    
    // Pastikan JWT_SECRET ada
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET tidak ditemukan di .env');
    }

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '3h' }, // Token berlaku selama 3 jam
      (err, token) => {
        if (err) throw err;
        
        // 7. Kirim token dan info pengguna ke frontend
        res.json({
          message: 'Login berhasil!',
          token,
          user: {
            nama: user.nama,
            role: user.role // Kirim role
          }
        });
      }
    );

  } catch (error) {
    console.error('Error saat login:', error);
    // Ini akan menangkap error 'secretOrPrivateKey must have a value'
    if (error.message.includes('secretOrPrivateKey')) {
         return res.status(500).json({ message: 'Server error: JWT Secret tidak diatur.' });
    }
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Mengirim email reset password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Cek apakah email ada
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      // JANGAN beri tahu jika email tidak ada (keamanan)
      return res.status(200).json({ message: 'Jika email terdaftar, email reset password akan dikirim.' });
    }

    // 2. Buat token reset (token acak, bukan JWT)
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Token kedaluwarsa dalam 10 menit
    const tokenExpires = new Date(Date.now() + 10 * 60 * 1000); 

    // 3. Simpan token ke database
    await db.query(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id_user = ?',
      [resetToken, tokenExpires, user.id_user]
    );

    // 4. Buat URL Reset
    // PERBAIKAN: Pastikan URL ini cocok dengan struktur Anda
    const resetURL = `http://localhost/halo-kaka-project/frontend/lupa-password.html?token=${resetToken}&email=${email}`;
    
    // 5. Buat Pesan Email (HTML)
    const message = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Permintaan Reset Password Halo KAKA</h2>
        <p>Anda menerima email ini karena ada permintaan untuk me-reset password akun Anda.</p>
        <p>Silakan klik tombol di bawah untuk melanjutkan. Link ini hanya valid selama 10 menit:</p>
        <a href="${resetURL}" style="background-color: #3486d9; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password Saya
        </a>
        <p>Jika Anda tidak merasa meminta ini, abaikan saja email ini.</p>
        <hr>
        <p style="font-size: 0.9em; color: #777;">Email ini dikirim otomatis. Mohon tidak membalas.</p>
      </div>
    `;

    // 6. Kirim Email
    await sendEmail({
      to: user.email,
      subject: 'Reset Password Halo KAKA',
      html: message
    });

    res.status(200).json({ message: 'Email reset password telah dikirim. Silakan periksa kotak masuk Anda.' });

  } catch (error) {
    console.error('Error saat forgot password:', error);
    // Hapus token jika pengiriman email gagal
    await db.query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = ?', [req.body.email]);
    res.status(500).json({ message: 'Gagal mengirim email.' });
  }
};


/**
 * @route   POST /api/auth/reset-password
 * @desc    Me-reset password pengguna
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    // 1. Validasi input
    if (!token || !email || !password) {
      return res.status(400).json({ message: 'Data tidak lengkap (token, email, password).' });
    }

    // 2. Cari pengguna berdasarkan token DAN email
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > NOW()',
      [email, token]
    );
    
    const user = rows[0];

    // 3. Cek apakah token valid
    if (!user) {
      return res.status(400).json({ message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }

    // 4. Enkripsi password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Update password di DB
    await db.query(
      'UPDATE users SET password = ? WHERE id_user = ?',
      [hashedPassword, user.id_user]
    );

    // 6. Hapus token (agar tidak bisa dipakai lagi)
    await db.query(
      'UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id_user = ?',
      [user.id_user]
    );

    res.status(200).json({ message: 'Password berhasil di-reset! Silakan login.' });

  } catch (error) {
    console.error('Error saat reset password:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};