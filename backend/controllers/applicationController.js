// File ini berisi LOGIKA untuk setiap endpoint aplikasi

import db from '../config/db.js';

/**
 * @route   GET /api/aplikasi
 * @desc    Mengambil semua aplikasi yang AKTIF
 */
export const getAllAplikasi = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM applications WHERE status_aplikasi = 'Aktif' AND flag_view = TRUE ORDER BY nama ASC"
    );
    res.json(rows);
  } catch (error) {
    console.error('Error saat mengambil aplikasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

/**
 * @route   POST /api/aplikasi/submit
 * @desc    Menerima pengajuan aplikasi baru (dari index.html)
 */
export const submitAplikasi = async (req, res) => {
  try {
    // Ambil data dari body request
    const { nama, kategori, penjelasan, link, narahubung, developer, tahun_buat } = req.body;

    // Validasi sederhana
    if (!nama || !link || !developer || !tahun_buat) {
      return res.status(400).json({ message: 'Data yang diperlukan kurang lengkap (Nama, Link, Developer, Tahun)' });
    }

    // Masukkan ke tabel 'add_apps' (tabel pengajuan)
    const [result] = await db.query(
      'INSERT INTO add_apps (nama, kategori, penjelasan, link, narahubung, developer, tahun_buat, status_aplikasi) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [nama, kategori, penjelasan, link, narahubung, developer, tahun_buat, 'Menunggu Persetujuan']
    );

    res.status(201).json({ message: 'Aplikasi berhasil diajukan!', id: result.insertId });

  } catch (error) {
    console.error('Error saat submit aplikasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};