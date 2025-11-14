// --- File: frontend/js/main.js ---
// (Versi lengkap dengan restrukturisasi, login, logout, dan highlight nav)

// --- Variabel Global untuk State ---
// (Variabel ini akan digunakan oleh fungsi di komponen yang dimuat)
let captchaNum1, captchaNum2, captchaAnswer;

// --- Fungsi Global (dapat dipanggil dari HTML) ---

/**
 * Membuka modal berdasarkan ID
 * @param {string} modalId - ID dari elemen modal
 */
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden';
        
        // Generate captcha baru HANYA jika modal login dibuka
        if (modalId === 'modal-login') {
            generateLoginCaptcha();
        }
    }
}

/**
 * Menutup modal berdasarkan ID
 * @param {string} modalId - ID dari elemen modal
 */
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        
        // Reset form saat modal ditutup
        if (modalId === 'modal-login') {
            const form = document.getElementById('form-login');
            const msg = document.getElementById('login-message');
            if (form) form.reset();
            if (msg) msg.style.display = 'none';
        }
        if (modalId === 'modal-lupa-password') {
            const form = document.getElementById('form-lupa-password');
            const msg = document.getElementById('lupa-message');
            if (form) form.reset();
            if (msg) msg.style.display = 'none';
        }
    }
}

/**
 * Menutup menu hamburger (dipanggil dari link menu mobile)
 */
window.closeHamburger = function() {
    const toggle = document.getElementById('menu-toggle');
    if (toggle) {
        toggle.checked = false;
    }
}

/**
 * Pindah dari modal login ke modal lupa password
 */
window.openLupaPassword = function() {
    closeModal('modal-login');
    openModal('modal-lupa-password');
}

/**
 * Melakukan proses logout (dipanggil dari modal konfirmasi)
 */
window.confirmLogout = function() {
    localStorage.removeItem('haloKakaToken');
    localStorage.removeItem('haloKakaUserName');
    localStorage.removeItem('haloKakaUserRole');
    closeModal('modal-logout-confirm');
    
    // Refresh halaman untuk memperbarui header
    window.location.reload(); 
}

// --- Fungsi Internal (Helpers) ---

/**
 * Memuat konten HTML parsial ke dalam elemen placeholder
 * @param {string} componentUrl - Path ke file HTML (misal: 'components/header.html')
 * @param {string} placeholderId - ID elemen target (misal: 'header-placeholder')
 */
async function loadComponent(componentUrl, placeholderId) {
    try {
        const response = await fetch(componentUrl);
        if (!response.ok) {
            throw new Error(`Gagal memuat ${componentUrl}: ${response.statusText}`);
        }
        const html = await response.text();
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = html;
        } else {
            console.warn(`Placeholder '${placeholderId}' tidak ditemukan.`);
        }
    } catch (error) {
        console.error(`Error memuat komponen ${componentUrl}:`, error);
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = `<div class="text-red-500 text-center p-4">Gagal memuat komponen ${componentUrl}.</div>`;
        }
    }
}

/**
 * Generate captcha matematika untuk MODAL LOGIN
 */
function generateLoginCaptcha() {
    captchaNum1 = Math.floor(Math.random() * 10) + 1;
    captchaNum2 = Math.floor(Math.random() * 5) + 1;
    captchaAnswer = captchaNum1 + captchaNum2;

    // --- PERBAIKAN KETIDAKKONSISTENAN ---
    // ID ini sekarang cocok dengan modals.html
    const qEl = document.getElementById('login-captcha-question');
    const aEl = document.getElementById('login-captcha-answer');
    // --- AKHIR PERBAIKAN ---

    if (qEl) qEl.innerText = `${captchaNum1} + ${captchaNum2} = ?`;
    if (aEl) aEl.value = '';
}

/**
 * Memeriksa status login dari localStorage dan memperbarui UI header
 */
function checkLoginStatus() {
    const token = localStorage.getItem('haloKakaToken');
    const userName = localStorage.getItem('haloKakaUserName');
    const userRole = localStorage.getItem('haloKakaUserRole'); // Ambil role

    // Elemen Desktop
    const greetingEl = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const dashboardLink = document.getElementById('dashboard-link'); // Link dashboard desktop

    // Elemen Mobile
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    const dashboardLinkMobile = document.getElementById('dashboard-link-mobile'); // Link dashboard mobile


    if (token && userName) {
        // --- Pengguna SUDAH LOGIN ---
        
        // --- PERUBAHAN YANG DIMINTA ---
        // Menggunakan innerHTML untuk sapaan yang diformat
        const sapaanHtml = `Halo KAKA, <span class="font-semibold text-gray-700">${userName}</span>`;
        
        // Tampilkan sapaan (Desktop & Mobile)
        if (greetingEl) {
            greetingEl.innerHTML = sapaanHtml; // Diubah dari innerText
            greetingEl.classList.remove('hidden');
        }

        // --- AKHIR PERUBAHAN ---
        
        // Tampilkan link Dashboard (Desktop & Mobile)
        if (dashboardLink) dashboardLink.classList.remove('hidden');
        if (dashboardLinkMobile) dashboardLinkMobile.classList.remove('hidden');

        // Sembunyikan tombol Login (Desktop & Mobile)
        if (loginBtn) loginBtn.classList.add('hidden');
        if (loginBtnMobile) loginBtnMobile.classList.add('hidden');
        
        // Tampilkan tombol Logout (Desktop & Mobile)
        if (logoutBtn) logoutBtn.classList.remove('hidden');
        if (logoutBtnMobile) logoutBtnMobile.classList.remove('hidden');
    

    } else {
        // --- Pengguna BELUM LOGIN ---
        // Sembunyikan sapaan
        // if (greetingEl) greetingEl.classList.add('hidden');
        // if (greetingMobileEl) greetingMobileEl.classList.add('hidden');

        // Sembunyikan link Dashboard
        if (dashboardLink) dashboardLink.classList.add('hidden');
        if (dashboardLinkMobile) dashboardLinkMobile.classList.add('hidden');
        
        // Tampilkan tombol Login
        if (loginBtn) loginBtn.classList.remove('hidden');
        if (loginBtnMobile) loginBtnMobile.classList.remove('hidden');
        
        // Sembunyikan tombol Logout
        if (logoutBtn) logoutBtn.classList.add('hidden');
        if (logoutBtnMobile) logoutBtnMobile.classList.add('hidden');
    }
}

/**
 * Menyorot link navigasi yang aktif berdasarkan halaman saat ini
 */
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop(); // Mendapatkan nama file (misal: "index.html")
    const currentHash = window.location.hash; // Mendapatkan hash (misal: "#daftar")

    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('data-page'); // "index.html", "kolam-aplikasi.html", "index.html#daftar"

        // Hapus styling aktif dulu
        link.classList.remove('text-accent', 'font-semibold');
        link.classList.add('text-gray-600');

        if (currentPage === '' || currentPage === 'index.html') {
            // Kita ada di Halaman Beranda
            if (!currentHash && (linkPage === 'index.html')) {
                // Link "Beranda"
                link.classList.add('text-accent', 'font-semibold');
            } else if (currentHash && linkPage === `index.html${currentHash}`) {
                // Link Anchor (misal: Top App, Daftar)
                link.classList.add('text-accent', 'font-semibold');
            }
        } else {
            // Kita ada di Halaman Lain (misal: kolam-aplikasi.html)
            if (linkPage === currentPage) {
                link.classList.add('text-accent', 'font-semibold');
            }
        }
    });
}


/**
 * Memasang event listener untuk form-form di dalam modal.
 * HARUS dipanggil setelah modal dimuat.
 */
function attachModalListeners() {
    
    // --- 1. Form Login ---
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            const messageEl = document.getElementById('login-message');
            messageEl.style.display = 'none';
            messageEl.className = 'text-sm'; // Reset class

            // 1. Validasi Captcha (Front-end)
            // --- PERBAIKAN KETIDAKKONSISTENAN ---
            const userAnswer = parseInt(document.getElementById('login-captcha-answer').value);
            // --- AKHIR PERBAIKAN ---
            
            if (userAnswer !== captchaAnswer) {
                messageEl.innerText = 'Error: Jawaban verifikasi salah. Silakan coba lagi.';
                messageEl.classList.add('text-red-600');
                messageEl.style.display = 'block';
                generateLoginCaptcha(); // Buat soal baru
                return;
            }

            // 2. Kirim data login ke API Backend
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // --- Login Berhasil ---
                    // Simpan token, nama, dan role ke localStorage
                    localStorage.setItem('haloKakaToken', data.token);
                    localStorage.setItem('haloKakaUserName', data.user.nama);
                    localStorage.setItem('haloKakaUserRole', data.user.role);
                    
                    messageEl.innerText = 'Login berhasil! Mengalihkan...';
                    messageEl.classList.add('text-green-600');
                    messageEl.style.display = 'block';
                    
                    // Muat ulang halaman untuk memperbarui header
                    setTimeout(() => {
                        window.location.reload(); 
                    }, 1000);

                } else {
                    // --- Login Gagal ---
                    messageEl.innerText = `Error: ${data.message || 'Kredensial tidak valid.'}`;
                    messageEl.classList.add('text-red-600');
                    messageEl.style.display = 'block';
                    generateLoginCaptcha(); // Buat soal baru
                }

            } catch (error) {
                console.error('Error saat login:', error);
                messageEl.innerText = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
                messageEl.classList.add('text-red-600');
                messageEl.style.display = 'block';
                generateLoginCaptcha();
            }
        });
    } else {
        console.warn("Formulir 'form-login' tidak ditemukan.");
    }

    // --- 2. Form Lupa Password ---
    const formLupaPassword = document.getElementById('form-lupa-password');
    if (formLupaPassword) {
        formLupaPassword.addEventListener('submit', async function(e) {
            e.preventDefault();
            const messageEl = document.getElementById('lupa-message');
            messageEl.style.display = 'none';
            messageEl.className = 'text-sm';
            const button = this.querySelector('button[type="submit"]');
            button.disabled = true;
            button.innerText = 'Mengirim...';

            const email = document.getElementById('lupa-email').value;

            try {
                // Kirim email ke API Backend
                const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                
                const data = await response.json();

                if (response.ok) {
                    messageEl.innerText = data.message; // "Email reset password telah dikirim..."
                    messageEl.classList.add('text-green-600');
                    messageEl.style.display = 'block';
                    
                    setTimeout(() => {
                        closeModal('modal-lupa-password');
                        button.disabled = false;
                        button.innerText = 'Kirim Link Reset';
                    }, 3000);
                } else {
                    messageEl.innerText = `Error: ${data.message || 'Gagal mengirim email.'}`;
                    messageEl.classList.add('text-red-600');
                    messageEl.style.display = 'block';
                    button.disabled = false;
                    button.innerText = 'Kirim Link Reset';
                }

            } catch (error) {
                console.error('Error saat lupa password:', error);
                messageEl.innerText = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
                messageEl.classList.add('text-red-600');
                messageEl.style.display = 'block';
                button.disabled = false;
                button.innerText = 'Kirim Link Reset';
            }
        });
    } else {
        console.warn("Formulir 'form-lupa-password' tidak ditemukan.");
    }
}


// --- TITIK MASUK UTAMA (ENTRY POINT) ---
// Script ini dieksekusi setelah halaman HTML selesai di-load (karena 'defer')
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Muat semua komponen secara paralel
    const loadPromises = [
        loadComponent('components/header.html', 'header-placeholder'),
        loadComponent('components/footer.html', 'footer-placeholder'),
        loadComponent('components/modals.html', 'modals-placeholder')
    ];
    
    // Tunggu SEMUA komponen selesai dimuat
    await Promise.all(loadPromises);

    // 2. Setelah semua komponen ada di DOM, pasang listener ke modal
    // (PENTING: Ini harus dipanggil SEBELUM checkLoginStatus)
    attachModalListeners();

    // 3. Cek status login untuk memperbarui header
    checkLoginStatus();
    
    // 4. Sorot link navigasi yang aktif
    highlightActiveNav();

    // 5. Panggil listener khusus halaman (didefinisikan di file HTML terkait)
    if (typeof attachPageSpecificListeners === 'function') {
        attachPageSpecificListeners();
    } else {
        console.log("Tidak ada 'attachPageSpecificListeners' di halaman ini.");
    }
});