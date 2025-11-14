import mysql from 'mysql2/promise';
// Load .env variables
import 'dotenv/config'; 

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    
    // FIX: Tambahkan baris ini untuk memilih database
    database: process.env.DB_DATABASE, 

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Uji koneksi
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Koneksi ke database MySQL berhasil dibuat.');
        connection.release();
    } catch (err) {
        console.error('Error koneksi ke database:', err.message);
        // Jika DB_DATABASE salah, errornya akan muncul di sini
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error(`Database dengan nama "${process.env.DB_DATABASE}" tidak ditemukan.`);
        }
    }
})();

export default pool;