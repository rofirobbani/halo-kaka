// File ini berisi LOGIKA untuk setiap endpoint aplikasi

import db from '../config/db.js';

// --- CACHE MEMORY (Server-Side) ---
let topAppsCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 1 * 60 * 1000; // 10 Menit dalam milidetik

/**
 * @route   GET /api/aplikasi/top
 * @desc    Mengambil 5 Aplikasi Terpopuler (Cached)
 */
export const getTopApplications = async (req, res) => {
    try {
        const now = Date.now();

        // 1. Cek apakah Cache masih valid (kurang dari 10 menit)
        if (topAppsCache && (now - lastCacheTime < CACHE_DURATION)) {
            console.log('Serving Top Apps from CACHE'); 
            return res.status(200).json(topAppsCache);
        }

        // 2. Jika tidak ada cache atau kadaluarsa, ambil dari DB
        console.log('Fetching Top Apps from DB...');
        
        const [rows] = await db.query(
            "SELECT * FROM applications WHERE status_aplikasi = 'Aktif' AND flag_view = TRUE ORDER BY jumlah_pengunjung DESC LIMIT 5"
        );

        // 3. Simpan ke Cache
        topAppsCache = rows;
        lastCacheTime = now;

        res.json(rows);

    } catch (error) {
        console.error('Error getting top apps:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
};

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
    // Ambil data dari body request (dari form di index.html)
    // PERBAIKAN: Menambahkan 'logo' di sini
    const { nama, kategori, penjelasan, link, narahubung, developer, tahun_buat, logo } = req.body;

    // Validasi sederhana
    if (!nama || !link || !developer || !tahun_buat) {
      return res.status(400).json({ message: 'Data yang diperlukan kurang lengkap (Nama, Link, Developer, Tahun)' });
    }

    // PERBAIKAN: Menambahkan kolom 'logo' pada kueri INSERT
    // 'logo' akan berisi string Base64 atau SVG default
    const [result] = await db.query(
      `INSERT INTO add_apps 
         (nama, kategori, penjelasan, link, narahubung, developer, tahun_buat, status_aplikasi, id_user_pengaju, logo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nama, kategori, penjelasan, link, narahubung, developer, tahun_buat, 'Menunggu Persetujuan', null, logo]
    );

    res.status(201).json({ message: 'Aplikasi berhasil diajukan!', id: result.insertId });

  } catch (error) {
    console.error('Error saat submit aplikasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
  }
};

/**
 * @route   POST /api/aplikasi/:id/visit
 * @desc    Menambah jumlah pengunjung (+1) saat aplikasi dibuka
 */
export const incrementVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        
        await db.query('UPDATE applications SET jumlah_pengunjung = jumlah_pengunjung + 1 WHERE id_app = ?', [id]);
        
        res.status(200).json({ message: 'Visitor count updated' });
    } catch (error) {
        console.error('Error incrementing visitor:', error);
        res.status(500).json({ message: 'Server error' });
    }
};