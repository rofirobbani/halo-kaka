// File ini berisi LOGIKA untuk endpoint laporan

import db from '../config/db.js';

/**
 * @route   POST /api/laporan
 * @desc    Menerima laporan aplikasi bermasalah
 */
export const createLaporan = async (req, res) => {
  try {
    const { id_app, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor } = req.body;

    // Validasi sederhana
    if (!id_app || !jenis_laporan || !nama_pelapor) {
      return res.status(400).json({ message: 'Data yang diperlukan kurang lengkap (ID Aplikasi, Jenis Laporan, Nama Pelapor)' });
    }

    // Masukkan ke tabel 'report_apps'
    const [result] = await db.query(
      'INSERT INTO report_apps (id_app, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor, status_laporan) VALUES (?, ?, ?, ?, ?, ?)',
      [id_app, nama_aplikasi, jenis_laporan, keterangan, nama_pelapor, 'Baru']
    );
    
    res.status(201).json({ message: 'Laporan berhasil dikirim!' });

  } catch (error) {
    console.error('Error saat membuat laporan:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};