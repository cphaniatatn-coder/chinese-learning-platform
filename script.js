// ==========================================
// GLOBALS & STATE MANAGEMENT
// ==========================================
let allData = [];         // Menampung data dari JSON/data.js
let currentList = [];     // Kosakata bab yang sedang aktif
let currentIndex = 0;     // Index kata/soal saat ini
let currentSpeed = 0.7;   // Default kecepatan audio (Anti-Gugup)
let currentLevel = '';    // Level aktif (A0, A1, A2)
let currentChapter = '';  // Bab aktif
let currentStage = 'vocab'; // vocab, vocab-test, grammar, reading, final-test
let score = 0;            // Menghitung jawaban benar saat tes

// ==========================================
// 1. INITIALIZATION & DATA LOADING
// ==========================================
// Memuat data saat aplikasi pertama kali dibuka
window.onload = function() {
    // Simulasi fetch data (atau bisa langsung membaca variabel jika memakai data.js)
    fetch('8000生詞.json')
        .then(res => res.json())
        .then(data => {
            allData = data;
            // Menuju ke Landing Page bawaan Claude di awal
            showPage('page-landing');
        })
        .catch(err => {
            document.getElementById('dash-content').innerText = "Gagal memuat data kosakata. Pastikan berkas data sudah benar.";
        });
};

// ==========================================
// 2. NAVIGATION OVERRIDE (Single Page Application)
// ==========================================
function showPage(pageId) {
    // Sembunyikan semua halaman dengan menghapus kelas 'active'
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Tampilkan halaman yang dituju
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Pemicu rendering konten jika masuk ke Dashboard
    if (pageId === 'page-dashboard') {
        showLevelsMenu();
    }
}

// ==========================================
// 3. DASHBOARD LOGIC (Sistem Level & Per Bab)
// ==========================================
// Menampilkan Pilihan Tingkat (A0, A1, A2)
function showLevelsMenu() {
    document.getElementById('dash-title').innerText = "請選擇學習等級 (Pilih Tingkat)";
    
    // Memilah level unik (A0, A1, A2)
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    
    let html = `<div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">`;
    html += levels.map(lv => `<button class="btn-primary" style="width:100%;" onclick="showUnitsMenu('${lv}')">${lv} 等級 (Tingkat ${lv})</button>`).join('');
    html += `</div>`;
    
    document.getElementById('dash-content').innerHTML = html;
}

// Menampilkan Pilihan Bab di dalam Level tersebut
function showUnitsMenu(lv) {
    currentLevel = lv;
    document.getElementById('dash-title').innerText = lv + " 課程單元選擇 (Pilihan Bab)";
    
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    // Mengambil daftar Bab unik dari properti '單元' atau '領域'
    const chapters = [...new Set(filtered.map(item => item.單元 || item.領域))];
    
    let html = `<button class="btn-outline" style="margin-bottom: 15px;" onclick="showLevelsMenu()">← 返回等級選單</button>`;
    html += `<div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">`;
    
    html += chapters.map((chap, index) => {
        return `<button class="btn-primary" style="background: #5c6bc0; width:100%;" onclick="startChapter('${lv}', '${chap}')">第 ${index + 1} 單元：${chap}</button>`;
    }).join('');
    
    html += `</div>`;
    
    document.getElementById('dash-content').innerHTML = html;
}

// ==========================================
// 4. MAIN LEARNING ENGINE (Alur Terintegrasi)
// ==========================================
function startChapter(lv, chap) {
    currentChapter = chap;
    // Filter kosakata khusus level dan bab aktif
    currentList = allData.filter(item => {
        const itemChap = item.單元 || item.領域;
        return item.序號編碼.startsWith(lv) && itemChap === chap;
    });
    
    if (currentList.length === 0) {
        alert("Tidak ada kosakata di bab ini!");
        return;
    }

    showPage('page-quiz'); // Pindah ke layar belajar utama Claude
    startVocabStage();     // Mulai Tahap 1
}

// --- TAHAP 1: PENGENALAN KOSAKATA (Flashcard) ---
function startVocabStage() {
    currentStage = 'vocab';
    currentIndex = 0;
    document.getElementById('quiz-step-label').innerText = "步驟一：生詞學習 (Flashcard)";
    document.getElementById('quiz-prog-fill').style.width = "20%";
    document.getElementById('quiz-instruction').innerText = "單元：" + currentChapter + " | 請點擊字卡查看拼音與定義";
    
    renderFlashcardLayout();
}

function renderFlashcardLayout() {
    const item = currentList[currentIndex];
    
    let html = `
        <!-- Pengontrol Kecepatan Suara Taiwan (Anti-Gugup) -->
        <div style="text-align:center; margin-bottom: 20px;">
            <span style="font-size:13px; color:#7f8c8d;">音速 (Kecepatan Audio): </span>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(0.6)" id="spd-0.6">0.6x 慢速</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px; background:#4caf50; color:white;" onclick="changeSpeed(0.8)" id="spd-0.8">0.8x 標準</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(1.0)" id="spd-1.0">1.0x 考試</button>
        </div>

        <!-- Struktur Flashcard (Prinsip Kontiguitas Spasial: Pinyin sembunyi sebelum diklik) -->
        <div class="flashcard" style="border: 2px solid #e0e6ed; border-radius: 16px; padding: 40px 20px; text-align: center; cursor: pointer; min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" onclick="toggleCardFlip()">
            <div id="fc-word" style="font-size: 48px; font-weight: bold; color: #2c3e50;">${item.生詞}</div>
            <div id="fc-back" style="display: none; width: 100%; margin-top: 10px;">
                <div style="font-size: 22px; color: #e67e22; font-weight: 500; margin-bottom: 8px;">${item.拼音}</div>
                <div style="font-size: 18px; color: #7f8c8d; border-top: 1px dashed #e0e6ed; padding-top: 8px;">${item.定義}</div>
            </div>
            <div style="font-size: 12px; color: #b0bec5; margin-top: 15px;">${currentIndex + 1} / ${currentList.length}</div>
        </div>

        <button class="btn-primary full" style="background:#ff9800; margin-top: 20px;" onclick="event.stopPropagation(); speakChinese('${item.生詞}')">🔊 Play Audio</button>
        <button class="btn-primary full" style="margin-top: 10px;" onclick="nextCard()">下一個 (Berikutnya) →</button>
    `;
    
    document.getElementById('dynamic-quiz-content').innerHTML = html;
    speakChinese(item.生詞); // Otomatis putar pelafalan (Prinsip Modalitas)
}

function toggleCardFlip() {
    const backSide = document.getElementById('fc-back');
    if (backSide.style.display === "none") {
        backSide.style.display = "block";
    } else {
        backSide.style.display = "none";
    }
}

function nextCard() {
    if (currentIndex < currentList.length - 1) {
        currentIndex++;
        renderFlashcardLayout();
    } else {
        // Jika kosakata sudah selesai semua, aktifkan tombol "繼續" bawaan Claude di bawah
        document.getElementById('quiz-instruction').innerText = "🎉 Semua kosakata bab ini selesai dipelajari!";
        const nextBtn = document.getElementById('quiz-next-btn');
        nextBtn.style.display = "block";
        nextBtn.onclick = startVocabTest; // Hubungkan ke alur Tahap 2 (Tes Kosakata)
    }
}

// --- PENGONTROL AUDIO TAIWAN DENGAN KECEPATAN DINAMIS ---
function changeSpeed(speed) {
    currentSpeed = speed;
    [0.6, 0.8, 1.0].forEach(s => {
        const btn = document.getElementById(`spd-${s}`);
        if (btn) {
            if (s === speed) {
                btn.style.background = "#4caf50";
                btn.style.color = "white";
            } else {
                btn.style.background = "transparent";
                btn.style.color = "#4a90e2";
            }
        }
    });
}

function speakChinese(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Zero-Delay: Hentikan audio sebelumnya seketika
        let cleanText = text.includes('/') ? text.split('/')[0] : text;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-TW'; // Aksentuasi asli Taiwan untuk standardisasi TOCFL
        utterance.rate = currentSpeed;
        window.speechSynthesis.speak(utterance);
    }
}

// --- EXIT NAVIGATION ---
function exitQuiz() {
    if (confirm("Apakah Anda yakin ingin keluar dari bab ini? Progres pengerjaan saat ini tidak disimpan.")) {
        document.getElementById('quiz-next-btn').style.display = "none";
        showPage('page-dashboard');
    }
}

// Tahap 2: Tes Kosakata (Dapat dikembangkan logika pengacak/distractor selanjutnya di sini)
function startVocabTest() {
    document.getElementById('quiz-next-btn').style.display = "none";
    document.getElementById('quiz-step-label').innerText = "步驟二：生詞測試 (Latihan Soal)";
    document.getElementById('quiz-prog-fill').style.width = "40%";
    
    document.getElementById('dynamic-quiz-content').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p><em>[Tahap 2: Tes Kosakata Menjawab Keluhan Banyak Latihan di Kuisioner Sedang Aktif]</em></p>
            <button class="btn-primary full" onclick="showPage('page-dashboard')">Kembali ke Dashboard</button>
        </div>
    `;
}

// ==========================================
// TAHAP 2: TES KOSAKATA (Generator Pilihan Ganda)
// ==========================================

// Fungsi Utama untuk Memulai Tes Kosakata
function startVocabTest() {
    currentStage = 'vocab-test';
    currentIndex = 0;
    score = 0; // Reset skor latihan
    
    document.getElementById('quiz-step-label').innerText = "步驟二：生詞測試 (Latihan Soal)";
    document.getElementById('quiz-prog-fill').style.width = "40%";
    
    // Menyembunyikan tombol "繼續" bawaan Claude selama kuis berlangsung
    document.getElementById('quiz-next-btn').style.display = "none";
    
    renderVocabQuiz();
}

// Fungsi untuk Merakit Pertanyaan dan Pilihan Jawaban
function renderVocabQuiz() {
    // Sembunyikan feedback jawaban sebelumnya
    document.getElementById('quiz-feedback').innerHTML = "";
    
    const correctAnswerItem = currentList[currentIndex];
    
    // 1. Membuat daftar pilihan jawaban (1 Benar + 3 Pengecoh Acak)
    let options = [correctAnswerItem];
    
    // Mengambil kata acak dari seluruh database JSON untuk dijadikan pengecoh
    while (options.length < 4) {
        const randomItem = allData[Math.floor(Math.random() * allData.length)];
        // Memastikan kata pengecoh tidak kembar dan bukan kata yang benar
        if (!options.some(opt => opt.生詞 === randomItem.生詞)) {
            options.push(randomItem);
        }
    }
    
    // 2. Mengacak urutan tombol pilihan jawaban (Prinsip Edukasi)
    options.sort(() => Math.random() - 0.5);
    
    // 3. Merakit instruksi dan layout kuis fungsional (Prinsip Koherensi: Tanpa gambar dekorasi)
    document.getElementById('quiz-instruction').innerText = `請選擇正確的定義 (Pilihlah arti yang tepat untuk kata berikut):`;
    
    let html = `
        <div style="text-align: center; margin: 20px 0;">
            <!-- Menampilkan Hanzi dengan ukuran besar agar fokus visual siswa terjaga -->
            <div style="font-size: 56px; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">${correctAnswerItem.生詞}</div>
            
            <!-- Tombol pendengaran suara audio standar Taiwan untuk melatih aspek pendengaran -->
            <button class="btn-outline" style="padding: 6px 15px; width: auto; display: inline-block; font-size: 14px;" onclick="speakChinese('${correctAnswerItem.生詞}')">🔊 聽發音 (Dengar Suara)</button>
        </div>

        <!-- Kisi Tombol Pilihan Jawaban dari Desain Claude -->
        <div class="quiz-choices" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            ${options.map(opt => `
                <button class="btn-primary" style="background: white; color: #2c3e50; border: 2px solid #e0e6ed; width: 100%; text-align: left; padding: 15px;" 
                        onclick="checkVocabAnswer('${opt.生詞}', '${correctAnswerItem.生詞}')">
                    ${opt.定義}
                </button>
            `).join('')}
        </div>
        
        <div style="text-align: center; font-size: 13px; color: #b0bec5; margin-top: 15px;">
            進度 (Progres): ${currentIndex + 1} / ${currentList.length} Soal
        </div>
    `;
    
    document.getElementById('dynamic-quiz-content').innerHTML = html;
    speakChinese(correctAnswerItem.生詞); // Otomatis putar audio pelafalan
}

// Fungsi untuk Memeriksa Jawaban Siswa (Fitur Evaluasi Instan)
function checkVocabAnswer(selectedWord, correctWord) {
    const feedbackDiv = document.getElementById('quiz-feedback');
    const choiceButtons = document.querySelectorAll('.quiz-choices button');
    
    // Mengunci semua tombol agar tidak bisa diklik dua kali setelah menjawab
    choiceButtons.forEach(btn => btn.disabled = true);
    
    if (selectedWord === correctWord) {
        // Jika jawaban Benar
        score++;
        feedbackDiv.innerHTML = `
            <div style="background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 10px; margin-top: 15px; font-weight: bold; text-align: center;">
                ✅ 正確 (Benar)!
            </div>
        `;
    } else {
        // Jika jawaban Salah (Menerapkan Fitur Isyarat/Signaling)
        feedbackDiv.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 10px; margin-top: 15px; font-weight: bold; text-align: center;">
                ❌ 錯誤 (Salah)! <br/>
                <span style="font-size: 13px; font-weight: normal; color: #555;">Kata yang benar adalah: <strong>${correctWord}</strong></span>
            </div>
        `;
    }
    
    // Memunculkan kembali tombol "繼續" milik Claude untuk melangkah ke soal berikutnya
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.style.display = "block";
    
    // Mengatur tindakan tombol berikutnya
    nextBtn.onclick = function() {
        if (currentIndex < currentList.length - 1) {
            currentIndex++;
            renderVocabQuiz();
            nextBtn.style.display = "none"; // Sembunyikan kembali sampai soal berikutnya dijawab
        } else {
            // Jika latihan soal sudah selesai, arahkan ke Tahap 3 (Grammar)
            endVocabTestStage();
        }
    };
}

// Fungsi Penutup Tahap 2 untuk Mengarahkan ke Tahap 3
function endVocabTestStage() {
    const accuracy = Math.round((score / currentList.length) * 100);
    
    document.getElementById('quiz-instruction').innerText = "🎉 Tahap latihan soal kosakata telah selesai!";
    
    document.getElementById('dynamic-quiz-content').innerHTML = `
        <div style="background: #e8f4fd; padding: 25px; border-radius: 16px; text-align: center; border: 1px solid #b3e5fc;">
            <h3 style="color: #0288d1; margin-top: 0;">單元測試結果 (Hasil Latihan)</h3>
            <p style="font-size: 16px; color: #555;">Anda berhasil menjawab benar <strong>${score}</strong> dari <strong>${currentList.length}</strong> kosakata.</p>
            <p style="font-size: 24px; font-weight: bold; color: #0288d1; margin: 15px 0;">正確率 (Akurasi): ${accuracy}%</p>
        </div>
    `;
    
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "进入步骤三：語法學習 (Grammar) →";
    nextBtn.onclick = startGrammarStage; // Hubungkan ke fungsi Tahap 3 selanjutnya
}

function startGrammarStage() {
    // Tombol dikembalikan teks aslinya untuk kebutuhan navigasi umum
    document.getElementById('quiz-next-btn').innerText = "繼續"; 
    document.getElementById('quiz-next-btn').style.display = "none";
    
    document.getElementById('quiz-step-label').innerText = "步驟三：語法學習 (Grammar)";
    document.getElementById('quiz-prog-fill').style.width = "60%";
    
    document.getElementById('dynamic-quiz-content').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p><em>[Tahap 3: Struktur Rumus Tata Bahasa Berdasarkan Analisis Personal Data Sedang Disiapkan]</em></p>
            <button class="btn-primary full" onclick="showPage('page-dashboard')">返回主選單</button>
        </div>
    `;
}
