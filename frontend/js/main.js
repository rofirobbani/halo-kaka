// --- File: frontend/js/main.js ---
// (Versi lengkap dengan load komponen, auth, dan modal)

// --- State Global ---
let captchaNum1, captchaNum2, captchaAnswer;

// --- Fungsi Pemuat Komponen ---
/**
 * Memuat konten HTML dari file parsial ke elemen placeholder.
 * @param {string} componentUrl - Path ke file HTML komponen (mis: 'components/header.html')
 * @param {string} placeholderId - ID elemen div placeholder (mis: 'header-placeholder')
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
        console.error(error);
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = `<p class="text-red-500 text-center">Gagal memuat komponen ${placeholderId}.</p>`;
        }
    }
}

// --- Fungsi Modal (Global) ---
// Dibuat global agar bisa dipanggil dari HTML yang di-injeksi
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('flex');
        document.body.style.overflow = 'hidden'; // Mencegah scroll body
        
        // Generate captcha baru HANYA jika modal login dibuka
        if (modalId === 'modal-login') {
            generateLoginCaptcha();
        }
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('flex');
        document.body.style.overflow = 'auto';
        
        // Reset form saat modal ditutup
        if (modalId === 'modal-login') {
            document.getElementById('form-login')?.reset();
            document.getElementById('login-message')?.setAttribute('hidden', 'true');
        }
        if (modalId === 'modal-lupa-password') {
            document.getElementById('form-lupa-password')?.reset();
            document.getElementById('lupa-message')?.setAttribute('hidden', 'true');
        }
    }
}

// Fungsi untuk pindah dari modal login ke lupa password
function openLupaPassword() {
    closeModal('modal-login');
    // Beri sedikit waktu agar transisi mulus
    setTimeout(() => openModal('modal-lupa-password'), 300);
}

// Fungsi untuk menutup menu mobile (setelah diklik)
function closeHamburger() {
     const menuToggle = document.getElementById('menu-toggle');
     if (menuToggle) {
        menuToggle.checked = false;
     }
}

// --- Fungsi Captcha (Global) ---
function generateLoginCaptcha() {
    captchaNum1 = Math.floor(Math.random() * 10) + 1;
    captchaNum2 = Math.floor(Math.random() * 5) + 1;
    captchaAnswer = captchaNum1 + captchaNum2;
    const qEl = document.getElementById('login-captcha-question');
    const aEl = document.getElementById('login-captcha-answer');
    if (qEl) qEl.innerText = `${captchaNum1} + ${captchaNum2} = ?`;
    if (aEl) aEl.value = '';
}

// --- Fungsi Autentikasi (Global) ---
function confirmLogout() {
    console.log("Logout dikonfirmasi. Membersihkan token...");
    localStorage.removeItem('haloKakaToken');
    localStorage.removeItem('haloKakaUserNama');
    closeModal('modal-logout-confirm');
    
    // Refresh halaman untuk memperbarui header
    window.location.reload();
}

/**
 * Memeriksa status login dari localStorage dan memperbarui UI header.
 */
function checkLoginStatus() {
    const token = localStorage.getItem('haloKakaToken');
    const nama = localStorage.getItem('haloKakaUserNama');
    
    // Target elemen UI
    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');

    if (token && nama) {
        // --- Pengguna SUDAH LOGIN ---
        if (userGreeting) {
            // Tampilkan sapaan di desktop
            userGreeting.innerHTML = `Halo KAKA, <span class="font-semibold text-gray-700">${nama}</span>`;
            userGreeting.classList.remove('text-3xl');
            userGreeting.classList.add('text-xl'); // Kecilkan font agar pas
        }
        
        // Tampilkan tombol Logout, sembunyikan Login
        loginBtn?.classList.add('hidden');
        loginBtnMobile?.classList.add('hidden');
        logoutBtn?.classList.remove('hidden');
        logoutBtnMobile?.classList.remove('hidden');
        
    } else {
        // --- Pengguna BELUM LOGIN ---
        if (userGreeting) {
            // Tampilkan logo default
            userGreeting.innerHTML = 'Halo KAKA';
            userGreeting.classList.add('text-3xl');
            userGreeting.classList.remove('text-xl');
        }
        
        // Tampilkan tombol Login, sembunyikan Logout
        loginBtn?.classList.remove('hidden');
        loginBtnMobile?.classList.remove('hidden');
        logoutBtn?.classList.add('hidden');
        logoutBtnMobile?.classList.add('hidden');
    }
}

/**
 * Menyorot link navigasi yang aktif berdasarkan halaman saat ini.
 */
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop();
    const currentHash = window.location.hash;
    const navLinks = document.querySelectorAll('.nav-link');

    let activeTarget = '';

    if (currentPage === 'index.html' || currentPage === '') {
        if (currentHash === '#top-app') activeTarget = 'top-app';
        else if (currentHash === '#daftar') activeTarget = 'daftar-app';
        else activeTarget = 'beranda';
    
    } else if (currentPage === 'kolam-aplikasi.html') {
        activeTarget = 'kolam-aplikasi';
    }
    // (Tambahkan 'else if' untuk halaman lain di masa depan)

    navLinks.forEach(link => {
        // Reset semua link
        link.classList.remove('text-accent', 'font-semibold');
        link.classList.add('text-gray-600');
        
        // Terapkan style aktif jika cocok
        if (link.getAttribute('data-nav') === activeTarget) {
            link.classList.add('text-accent', 'font-semibold');
            link.classList.remove('text-gray-600');
        }
    });
}


// --- Pemicu Listener Khusus Halaman ---
/**
 * Fungsi ini akan menampung semua listener yang spesifik
 * untuk halaman tertentu (mis: form di daftar.html atau
 * logika filter di kolam-aplikasi.html).
 * * Fungsi ini didefinisikan secara global di file HTML terkait
 * dan dipanggil oleh main.js SETELAH semua komponen dimuat.
 */
// (Fungsi 'attachPageSpecificListeners' didefinisikan di file HTML)


// --- TITIK MASUK UTAMA (MAIN ENTRY POINT) ---
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Tentukan komponen yang akan dimuat
    const loadPromises = [
        loadComponent('components/header.html', 'header-placeholder'),
        loadComponent('components/footer.html', 'footer-placeholder'),
        loadComponent('components/modals.html', 'modals-placeholder')
    ];
    
    // 2. Tunggu SEMUA komponen selesai dimuat
    await Promise.all(loadPromises);
    
    // 3. SETELAH komponen dimuat, pasang listener untuk modal
    //    (karena elemen modal sekarang ada di DOM)
    attachModalListeners();
    
    // 4. Periksa status login & perbarui header
    checkLoginStatus();
    
    // 5. Sorot navigasi yang aktif
    highlightActiveNav();

    // 6. Panggil listener khusus halaman (didefinisikan di file HTML terkait)
    if (typeof attachPageSpecificListeners === 'function') {
        attachPageSpecificListeners();
    } else {
        console.log("Tidak ada 'attachPageSpecificListeners' di halaman ini.");
    }
});


/**
 * Fungsi ini memasang semua listener untuk modal.
 * Ini dipanggil SETELAH modal.html selesai dimuat.
 */
function attachModalListeners() {
    
    // --- Form Login (Terhubung ke API) ---
    const formLogin = document.getElementById('form-login');
    const loginMessage = document.getElementById('login-message');

    if (formLogin) {
        formLogin.addEventListener('submit', async function(e) {
            e.preventDefault();
            loginMessage.setAttribute('hidden', 'true');
            loginMessage.className = 'text-sm';

            // 1. Validasi Captcha
            const userAnswer = parseInt(document.getElementById('login-captcha-answer').value);
            if (userAnswer !== captchaAnswer) {
                loginMessage.innerText = 'Error: Jawaban verifikasi salah.';
                loginMessage.classList.add('text-red-600');
                loginMessage.removeAttribute('hidden');
                generateLoginCaptcha(); // Buat soal baru
                return;
            }

            // 2. Kirim data ke API Backend
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
            try {
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    // --- Login Berhasil ---
                    loginMessage.innerText = 'Login berhasil! Memuat...';
                    loginMessage.classList.add('text-green-600');
                    loginMessage.removeAttribute('hidden');
                    
                    // Simpan token dan nama di localStorage
                    localStorage.setItem('haloKakaToken', data.token);
                    localStorage.setItem('haloKakaUserNama', data.user.nama);

                    // Refresh halaman untuk memperbarui header
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);

                } else {
                    // --- Login Gagal (Kredensial salah, dll) ---
                    loginMessage.innerText = `Error: ${data.message || 'Kredensial tidak valid.'}`;
                    loginMessage.classList.add('text-red-600');
                    loginMessage.removeAttribute('hidden');
                    generateLoginCaptcha(); // Buat soal baru
                }
            } catch (error) {
                // --- Login Gagal (Server down) ---
                console.error('Error saat login:', error);
                loginMessage.innerText = 'Error: Tidak dapat terhubung ke server.';
                loginMessage.classList.add('text-red-600');
                loginMessage.removeAttribute('hidden');
                generateLoginCaptcha();
            }
        });
    }

    // --- Form Lupa Password (Terhubung ke API) ---
    const formLupaPassword = document.getElementById('form-lupa-password');
    const lupaMessage = document.getElementById('lupa-message');

    if (formLupaPassword) {
        formLupaPassword.addEventListener('submit', async function(e) {
            e.preventDefault();
            lupaMessage.setAttribute('hidden', 'true');
            lupaMessage.className = 'text-sm';
            
            const email = document.getElementById('lupa-email').value;
            const button = e.target.querySelector('button[type="submit"]');
            
            try {
                button.disabled = true;
                button.innerText = 'Mengirim...';

                // Panggil API Backend
                const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const result = await response.json();

                if (response.ok) {
                    // Berhasil (atau email tidak ditemukan, backend tetap merespons OK)
                    lupaMessage.innerText = result.message; // "Jika email terdaftar..."
                    lupaMessage.classList.add('text-green-600');
                    lupaMessage.removeAttribute('hidden');
                    formLupaPassword.reset();
                    
                    setTimeout(() => closeModal('modal-lupa-password'), 4000);
                } else {
                    // Gagal (Error server)
                    lupaMessage.innerText = `Error: ${result.message || 'Gagal mengirim email.'}`;
                    lupaMessage.classList.add('text-red-600');
                    lupaMessage.removeAttribute('hidden');
                }
            
            } catch (error) {
                console.error('Error saat lupa password:', error);
                lupaMessage.innerText = 'Error: Tidak dapat terhubung ke server.';
                lupaMessage.classList.add('text-red-600');
                lupaMessage.removeAttribute('hidden');
            } finally {
                button.disabled = false;
                button.innerText = 'Kirim Link Reset';
            }
        });
    }
    
    // Cek jika URL memiliki ?login=true (misal dari halaman daftar/reset)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
        // Hapus parameter dari URL agar tidak terbuka lagi saat refresh
        window.history.replaceState(null, '', window.location.pathname);
        openModal('modal-login');
    }
}