import jwt from 'jsonwebtoken';
import 'dotenv/config'; // Pastikan .env dimuat

/**
 * Middleware untuk memvalidasi token JWT
 * Ini akan mengambil 'user' dari token dan menempelkannya ke 'req'
 */
const authMiddleware = (req, res, next) => {
    // Ambil token dari header 'authorization'
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
    }

    try {
        const token = authHeader.split(' ')[1]; // Ambil token (format: "Bearer <token>")

        // Verifikasi token menggunakan secret key kita
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Tempelkan info pengguna (dari payload token) ke objek 'req'
        // agar bisa diakses oleh controller selanjutnya
        req.user = decoded.user;
        
        // Lanjutkan ke fungsi controller (misal: getSubmissions)
        next();

    } catch (error) {
        res.status(401).json({ message: 'Token tidak valid.' });
    }
};

export default authMiddleware;