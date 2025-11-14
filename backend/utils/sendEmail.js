import nodemailer from 'nodemailer';
import 'dotenv/config';

// Opsi (options) ini akan berisi HTML dan teks untuk email
const sendEmail = async (options) => {
    // 1. Buat Transporter (Layanan email yang akan mengirim)
    // Kita gunakan Gmail
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: true, // true untuk port 465, false untuk port lain
        auth: {
            user: process.env.EMAIL_USER, // Email Gmail Anda dari .env
            pass: process.env.EMAIL_PASS, // 16 digit Google App Password dari .env
        },
    });

    // 2. Definisikan Opsi Email
    const mailOptions = {
        from: `Halo KAKA Admin <${process.env.EMAIL_USER}>`, // Nama pengirim
        to: options.email, // Email penerima (dari argumen fungsi)
        subject: options.subject, // Judul email (dari argumen fungsi)
        html: options.html, // Isi email (dari argumen fungsi)
    };

    // 3. Kirim Email
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email berhasil terkirim ke:', options.email);
    } catch (error) {
        console.error('Error saat mengirim email:', error);
        throw new Error('Gagal mengirim email.');
    }
};

export default sendEmail;