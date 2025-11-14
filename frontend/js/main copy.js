// --- Variabel Global ---
// (Didefinisikan di scope global agar bisa diakses oleh komponen parsial)
let captchaNum1, captchaNum2, captchaAnswer;

/**
 * Membuka modal berdasarkan ID
 * @param {string} modalId - ID elemen modal (misal: 'modal-login')
 */
window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal dengan ID "${modalId}" tidak ditemukan.`);
        return;
    }
    
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden'; // Mencegah scroll body

    // Jika modal login dibuka, generate captcha baru
    if (modalId === 'modal-login') {
        generateLoginCaptcha();
    }
}

/**
 * Menutup modal berdasarkan ID
 * @param {string} modalId - ID elemen modal
 */
window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal dengan ID "${modalId}" tidak ditemukan.`);
        return;
    }
    
    modal.classList.remove('flex');
    document.body.style.overflow = 'auto';
    
    // Reset form saat modal ditutup
    if (modalId === 'modal-login') {
        const form = document.getElementById('form-login');
        const msg = document.getElementById('login-message');
        if(form) form.reset();
        if(msg) msg.style.display = 'none';
    }
    if (modalId === 'modal-lupa-password') {
        const form = document.getElementById('form-lupa-password');
        const msg = document.getElementById('lupa-message');
        if(form) form.reset();
        if(msg) msg.style.display = 'none';
    }
}

/**
 * Menutup menu mobile (dipanggil dari onclick di header.html)
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
    // Beri sedikit jeda agar transisi CSS selesai
    setTimeout(() => {
        openModal('modal-lupa-password');
    }, 300); // 300ms sesuai durasi transisi
}

/**
 * Generate captcha matematika KHUSUS UNTUK MODAL LOGIN
 */
function generateLoginCaptcha() {
    captchaNum1 = Math.floor(Math.random() * 10) + 1;
    captchaNum2 = Math.floor(Math.random() * 5) + 1;
    captchaAnswer = captchaNum1 + captchaNum2; // Disimpan di var global
    
    const qEl = document.getElementById('login-captcha-question');
    const aEl = document.getElementById('login-captcha-answer');
    
    if (qEl) {
        qEl.innerText = `${captchaNum1} + ${captchaNum2} = ?`;
    }
    if (aEl) {
        aEl.value = '';
    }
}

/**
 * Memeriksa status login dari localStorage
 */
function checkLoginStatus() {
    const token = localStorage.getItem('haloKakaToken');
    const userName = localStorage.getItem('haloKakaUserName');

    const userGreeting = document.getElementById('user-greeting');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const loginBtnMobile = document.getElementById('login-btn-mobile');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');

    // Pastikan semua elemen ada sebelum mengubahnya
    if (!userGreeting || !loginBtn || !logoutBtn || !loginBtnMobile || !logoutBtnMobile) {
        console.warn('Satu atau lebih elemen header (login/logout) tidak ditemukan.');
        return;
    }

    if (token && userName) {
        // --- Status: LOGIN ---
        userGreeting.innerHTML = `Halo KAKA, <span class="font-medium text-gray-700">${userName}</span>`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        loginBtnMobile.style.display = 'none';
        logoutBtnMobile.style.display = 'block';
        
        // Ganti listener tombol logout agar memanggil modal konfirmasi
        logoutBtn.onclick = () => openModal('modal-logout-confirm');
        logoutBtnMobile.onclick = (e) => {
            e.preventDefault();
            openModal('modal-logout-confirm');
            closeHamburger();
        };

    } else {
        // --- Status: LOGOUT ---
        userGreeting.innerHTML = 'Halo KAKA';
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        loginBtnMobile.style.display = 'block';
        logoutBtnMobile.style.display = 'none';
        
        // Pastikan listener login kembali normal
        loginBtn.onclick = () => openModal('modal-login');
        loginBtnMobile.onclick = (e) => {
            e.preventDefault();
            openModal('modal-login');
            closeHamburger();
        };
    }
}

/**
 * Fungsi untuk Logout (Menghapus token)
 * Dibuat global agar bisa dipanggil dari modal-logout-confirm
 */
window.confirmLogout = function() {
    localStorage.removeItem('haloKakaToken');
    localStorage.removeItem('haloKakaUserName');
    localStorage.removeItem('haloKakaUser'); // Hapus juga data user lengkap
    
    // Tutup modal dan refresh halaman
    closeModal('modal-logout-confirm');
    window.location.reload();
}

/**
 * Menambahkan event listener ke form modal setelah dimuat
 */
function attachModalListeners() {
    
    // --- 1. Form Login ---
    const formLogin = document.getElementById('form-login');
    const loginMessage = document.getElementById('login-message');
    
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!loginMessage) return;

            loginMessage.style.display = 'none';
            loginMessage.className = 'text-sm';

            // 1. Validasi Captcha (menggunakan var global 'captchaAnswer')
            const userAnswer = parseInt(document.getElementById('login-captcha-answer').value);
            if (userAnswer !== captchaAnswer) {
                loginMessage.innerText = 'Error: Jawaban verifikasi salah. Silakan coba lagi.';
                loginMessage.classList.add('text-red-600');
                loginMessage.style.display = 'block';
                generateLoginCaptcha(); // Buat soal baru
                return;
            }

            // 2. Data untuk dikirim ke API
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                // 3. Panggil API Login
                const response = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password }),
                });

                const result = await response.json();

                if (response.ok) {
                    // --- Login Berhasil ---
                    loginMessage.innerText = 'Login berhasil! Memuat...';
                    loginMessage.classList.add('text-green-600');
                    loginMessage.style.display = 'block';

                    // 4. Simpan token dan nama di localStorage
                    localStorage.setItem('haloKakaToken', result.token);
                    localStorage.setItem('haloKakaUserName', result.user.nama);
                    localStorage.setItem('haloKakaUser', JSON.stringify(result.user)); // Simpan data user lengkap

                    // 5. Tutup modal dan refresh halaman
                    setTimeout(() => {
                        closeModal('modal-login');
                        window.location.reload(); // Refresh untuk update header
                    }, 1000);

                } else {
                    // --- Login Gagal (dari API) ---
                    loginMessage.innerText = `Error: ${result.message || 'Username atau password salah.'}`;
                    loginMessage.classList.add('text-red-600');
                    loginMessage.style.display = 'block';
                    generateLoginCaptcha();
                }

            } catch (error) {
                // --- Server API tidak terhubung ---
                console.error('Error saat login:', error);
                loginMessage.innerText = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
                loginMessage.classList.add('text-red-600');
                loginMessage.style.display = 'block';
                generateLoginCaptcha();
            }
        });
    }

    // --- 2. Form Lupa Password ---
    const formLupaPassword = document.getElementById('form-lupa-password');
    const lupaMessage = document.getElementById('lupa-message');
    
    if (formLupaPassword) {
        formLupaPassword.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!lupaMessage) return;

            lupaMessage.style.display = 'none';
            lupaMessage.className = 'text-sm';
            
            const email = document.getElementById('lupa-email').value;

            try {
                // Panggil API forgot-password
                const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const result = await response.json();

                if (response.ok) {
                    lupaMessage.innerHTML = `Permintaan terkirim. Jika email terdaftar, link akan dibuat. <br> <strong>Link Simulasi:</strong> <a href="${result.simulatedLink}" class="text-accent hover:underline break-all" target="_blank">(Buka link ini di tab baru)</a>`;
                    lupaMessage.classList.add('text-green-600');
                    lupaMessage.style.display = 'block';
                } else {
                    lupaMessage.innerText = `Error: ${result.message || 'Gagal mengirim permintaan.'}`;
                    lupaMessage.classList.add('text-red-600');
                    lupaMessage.style.display = 'block';
                }

            } catch (error) {
                console.error('Error saat lupa password:', error);
                lupaMessage.innerText = 'Tidak dapat terhubung ke server. Pastikan server backend berjalan.';
                lupaMessage.classList.add('text-red-600');
                lupaMessage.style.display = 'block';
            }
        });
    }
}


/**
 * Memberi highlight pada link navigasi yang aktif
 */
function highlightActiveNav() {
    const path = window.location.pathname.split("/").pop(); // Mendapat nama file: "index.html" atau "kolam-aplikasi.html"
    const hash = window.location.hash; // Mendapat hash: "#daftar"
    const navLinks = document.querySelectorAll('.nav-link');

    let activeLink = '';

    if (path === 'index.html' || path === '') {
        if (hash === '#top-app') activeLink = 'top-app';
        else if (hash === '#daftar') activeLink = 'daftar-app';
        else activeLink = 'beranda';
        
    } else if (path === 'kolam-aplikasi.html') {
        activeLink = 'kolam-aplikasi';
    } else if (path === 'daftar.html') {
        // Tidak ada link header, tapi jika ada, ini cara menambahkannya
        // activeLink = 'daftar-user'; 
    }

    navLinks.forEach(link => {
        // Hapus style lama
        link.classList.remove('text-accent', 'font-semibold');
        link.classList.add('text-gray-600');

        // Tambah style baru jika cocok
        if (link.getAttribute('data-nav') === activeLink) {
            link.classList.add('text-accent', 'font-semibold');
            link.classList.remove('text-gray-600');
        }
    });
}


/**
 * Fungsi Asinkron untuk memuat komponen HTML (header/footer)
 * @param {string} componentUrl - Path ke file (misal: 'components/header.html')
 * @param {string} placeholderId - ID elemen div (misal: 'header-placeholder')
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
            console.warn(`Placeholder dengan ID "${placeholderId}" tidak ditemukan.`);
        }
    } catch (error) {
        console.error(error);
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
            placeholder.innerHTML = `<p class="text-red-500 text-center">Gagal memuat ${componentUrl}.</p>`;
        }
    }
}

/**
 * --- TITIK MASUK UTAMA ---
 * Dieksekusi setelah DOM selesai dimuat
 */
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Tentukan komponen yang akan dimuat
    const componentsToLoad = [
        loadComponent('components/header.html', 'header-placeholder'),
        loadComponent('components/footer.html', 'footer-placeholder'),
        loadComponent('components/modals.html', 'modals-placeholder')
    ];

    // 2. Tunggu SEMUA komponen selesai dimuat
    await Promise.all(componentsToLoad);

    // 3. Setelah semua komponen ADA di DOM, jalankan fungsi-fungsi ini:
    
    // Periksa status login (untuk menampilkan/menyembunyikan nama)
    checkLoginStatus();
    
    // Pasang listener ke modal (misal: form login)
    attachModalListeners();
    
    // Beri highlight pada navigasi
    highlightActiveNav();

    // Cek jika URL memiliki ?login=true (misal dari halaman daftar)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'true') {
        // Hapus parameter dari URL agar tidak terbuka lagi saat di-refresh
        window.history.replaceState({}, document.title, window.location.pathname);
        openModal('modal-login');
    }

    // 4. Panggil listener khusus halaman (didefinisikan di file HTML terkait)
    //    (misal: loadAplikasi() di kolam-aplikasi.html)
    if (typeof attachPageSpecificListeners === 'function') {
        attachPageSpecificListeners();
    } else {
        console.log("Tidak ada 'attachPageSpecificListeners' di halaman ini.");
    }
});