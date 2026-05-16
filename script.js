// ==========================================
// GLOBALS & STATE MANAGEMENT
// ==========================================
let allData = [];         // Menampung data mentah dari 8000生詞.json
let currentList = [];     // Kosakata pada bab yang sedang aktif
let currentIndex = 0;     // Index kata atau soal yang sedang berjalan
let currentSpeed = 0.7;   // Default kecepatan audio lambat (Anti-Gugup)
let currentLevel = '';    // Level aktif (A0, A1, A2)
let currentChapter = '';  // Bab aktif yang sedang dipelajari
let currentStage = 'vocab'; // Mengunci tahapan: vocab, vocab-test, grammar
let score = 0;            // Nilai angka jawaban benar siswa saat tes

// ==========================================
// 1. INITIALIZATION & DATA LOADING (Dinamis dari JSON)
// ==========================================
window.onload = function() {
    // Membaca file JSON eksternal agar Anda bebas memperbarui data kapan saja
    fetch('8000生詞.json')
        .then(res => res.json())
        .then(data => {
            allData = data;
            // Menuju ke Landing Page sebagai visualisasi awal aplikasi
            showPage('page-landing');
        })
        .catch(err => {
            const contentDiv = document.getElementById('dash-content');
            if (contentDiv) {
                contentDiv.innerText = "Gagal memuat data kosakata. Pastikan berkas 8000生詞.json Anda sudah diunggah.";
            }
        });
};

// ==========================================
// 2. SPA NAVIGATION OVERRIDE (Manajemen Halaman Tanpa Delay)
// ==========================================
function showPage(pageId) {
    // Menyembunyikan semua kontainer halaman
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Menampilkan halaman yang dituju secara instan
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Jika pengguna menuju dasbor, otomatis panggil menu level utama
    if (pageId === 'page-dashboard') {
        showLevelsMenu();
    }
}

// ==========================================
// 3. DASHBOARD LOGIC (Kurikulum Sistem Per Bab)
// ==========================================
// Menampilkan Menu Tingkat Ujian (A0, A1, A2)
function showLevelsMenu() {
    document.getElementById('dash-title').innerText = "請選擇學習等級 (Pilih Tingkat Ujian)";
    
    // Memotong kode urut untuk mendapatkan nama level unik
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    
    let html = `<div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">`;
    html += levels.map(lv => `<button class="btn-primary" style="width:100%;" onclick="showUnitsMenu('${lv}')">${lv} 等級 (Tingkat ${lv})</button>`).join('');
    html += `</div>`;
    
    document.getElementById('dash-content').innerHTML = html;
}

// Menampilkan Daftar Pilihan Bab Berdasarkan Tingkat yang Dipilih
function showUnitsMenu(lv) {
    currentLevel = lv;
    document.getElementById('dash-title').innerText = lv + " 課程單元選擇 (Pilihan Bab)";
    
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    // Fallback sistem pembacaan properti '單元' atau nama '領域' yang lama
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
// 4. MAIN LEARNING ENGINE (Alur Linear-Sistematis)
// ==========================================
function startChapter(lv, chap) {
    currentChapter = chap;
    
    // Menyaring daftar kata yang masuk ke dalam bab aktif ini saja
    currentList = allData.filter(item => {
        const itemChap = item.單元 || item.領域;
        return item.序號編碼.startsWith(lv) && itemChap === chap;
    });
    
    if (currentList.length === 0) {
        alert("Tidak ada kosakata yang ditemukan untuk bab ini!");
        return;
    }

    showPage('page-quiz'); // Masuk ke layar kuis terpadu milik Claude
    startVocabStage();     // Eksekusi Tahap 1
}

// ------------------------------------------
// TAHAP 1: PENGENALAN KOSAKATA (Flashcard)
// ------------------------------------------
function startVocabStage() {
    currentStage = 'vocab';
    currentIndex = 0;
    
    document.getElementById('quiz-step-label').innerText = "步驟一：生詞學習 (Flashcard)";
    document.getElementById('quiz-prog-fill').style.width = "20%";
    document.getElementById('quiz-instruction').innerText = `單元：${currentChapter} | 請點擊字卡查看拼音與定義`;
    
    // Pastikan tombol navigasi utama disembunyikan di awal kartu
    document.getElementById('quiz-next-btn').style.display = "none";
    
    renderFlashcardLayout();
}

function renderFlashcardLayout() {
    const item = currentList[currentIndex];
    
    let html = `
        <!-- Pengontrol Kecepatan Suara Dinamis Taiwan -->
        <div style="text-align:center; margin-bottom: 20px;">
            <span style="font-size:13px; color:#7f8c8d;">音速 (Kecepatan Audio): </span>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(0.6)" id="spd-0.6">0.6x 慢速</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px; background:#4caf50; color:white;" onclick="changeSpeed(0.8)" id="spd-0.8">0.8x 標準</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(1.0)" id="spd-1.0">1.0x 考試</button>
        </div>

        <!-- Wadah Flashcard Berbalik (Prinsip Kontiguitas Spasial: Pinyin tersembunyi) -->
        <div class="flashcard" style="border: 2px solid #e0e6ed; border-radius: 16px; padding: 40px 20px; text-align: center; cursor: pointer; min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" onclick="toggleCardFlip()">
            <div id="fc-word" style="font-size: 48px; font-weight: bold; color: #2c3e50;">${item.生詞}</div>
            <div id="fc-back" style="display: none; width: 100%; margin-top: 10px;">
                <div style="font-size: 22px; color: #e67e22; font-weight: 500; margin-bottom: 8px;">${item.拼音}</div>
                <div style="font-size: 18px; color: #7f8c8d; border-top: 1px dashed #e0e6ed; padding-top: 8px;">${item.定義}</div>
            </div>
            <div style="font-size: 12px; color: #b0bec5; margin-top: 15px;">進度: ${currentIndex + 1} / ${currentList.length}</div>
        </div>

        <button class="btn-primary full" style="background:#ff9800; margin-top: 20px;" onclick="event.stopPropagation(); speakChinese('${item.生詞}')">🔊 Play Audio</button>
        <button class="btn-primary full" style="margin-top: 10px;" onclick="nextCard()">下一個 (Berikutnya) →</button>
    `;
    
    document.getElementById('dynamic-quiz-content').innerHTML = html;
    changeSpeed(currentSpeed); // Mempertahankan opsi kecepatan aktif
    speakChinese(item.生詞);    // Otomatis putar audio pelafalan (Prinsip Modalitas)
}

function toggleCardFlip() {
    const backSide = document.getElementById('fc-back');
    if (backSide) {
        backSide.style.display = (backSide.style.display === "none") ? "block" : "none";
    }
}

function nextCard() {
    if (currentIndex < currentList.length - 1) {
        currentIndex++;
        renderFlashcardLayout();
    } else {
        // Jika kosakata sudah habis dibaca, munculkan tombol jembatan ke Tahap 2
        document.getElementById('quiz-instruction').innerText = "🎉 Semua kosakata bab ini selesai dipelajari!";
        const nextBtn = document.getElementById('quiz-next-btn');
        nextBtn.style.display = "block";
        nextBtn.innerText = "進入步驟二：生詞測試 (Latihan Soal) →";
        nextBtn.onclick = startVocabTest; 
    }
}

// ------------------------------------------
// TAHAP 2: TES KOSAKATA (Generator Pilihan Ganda Otomatis)
// ------------------------------------------
function startVocabTest() {
    currentStage = 'vocab-test';
    currentIndex = 0;
    score = 0; 
    
    document.getElementById('quiz-step-label').innerText = "步驟二：生詞測試 (Latihan Soal)";
    document.getElementById('quiz-prog-fill').style.width = "40%";
    document.getElementById('quiz-next-btn').style.display = "none";
    
    renderVocabQuiz();
}

function renderVocabQuiz() {
    // Bersihkan kotak teks umpan balik jawaban sebelumnya
    document.getElementById('quiz-feedback').innerHTML = "";
    
    const correctAnswerItem = currentList[currentIndex];
    let options = [correctAnswerItem];
    
    // PENGAMAN: Mencegah infinite loop jika total data JSON Anda kurang dari 4 kata
    const maxOptions = allData.length >= 4 ? 4 : allData.length;
    let attempts = 0; 

    while (options.length < maxOptions && attempts < 100) {
        attempts++;
        const randomItem = allData[Math.floor(Math.random() * allData.length)];
        
        if (randomItem && randomItem.生詞 && randomItem.定義) {
            if (!options.some(opt => opt.生詞 === randomItem.生詞)) {
                options.push(randomItem);
            }
        }
    }
    
    // Mengacak posisi urutan opsi tombol jawaban
    options.sort(() => Math.random() - 0.5);
    
    document.getElementById('quiz-instruction').innerText = `請選擇正確的定義 (Pilihlah arti yang tepat untuk kata berikut):`;
    
    let html = `
        <div style="text-align: center; margin: 20px 0;">
            <div style="font-size: 56px; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">${correctAnswerItem.生詞}</div>
            <button class="btn-outline" style="padding: 6px 15px; width: auto; display: inline-block; font-size: 14px;" onclick="speakChinese('${correctAnswerItem.生詞}')">🔊 聽發音 (Dengar Suara)</button>
        </div>

        <div class="quiz-choices" style="display: flex; flex-direction: column; gap: 10px; width: 100%;">
            ${options.map(opt => `
                <button class="btn-primary" style="background: white; color: #2c3e50; border: 2px solid #e0e6ed; width: 100%; text-align: left; padding: 15px;"   
                        onclick="checkVocabAnswer('${opt.生詞}', '${correctAnswerItem.生詞}')">
                    ${opt.定義}
                </button>
            `).join('')}
        </div>
        
        <div style="text-align: center; font-size: 13px; color: #b0bec5; margin-top: 15px;">
            進度: ${currentIndex + 1} / ${currentList.length} Soal
        </div>
    `;
    
    document.getElementById('dynamic-quiz-content').innerHTML = html;
    speakChinese(correctAnswerItem.生詞); 
}

function checkVocabAnswer(selectedWord, correctWord) {
    const feedbackDiv = document.getElementById('quiz-feedback');
    const choiceButtons = document.querySelectorAll('.quiz-choices button');
    
    // Kunci tombol agar tidak dieksekusi berulang kali oleh siswa
    choiceButtons.forEach(btn => btn.disabled = true);
    
    if (selectedWord === correctWord) {
        score++;
        feedbackDiv.innerHTML = `
            <div style="background: #e8f5e9; color: #2e7d32; padding: 15px; border-radius: 10px; margin-top: 15px; font-weight: bold; text-align: center;">
                ✅ 正確 (Benar)!
            </div>
        `;
    } else {
        feedbackDiv.innerHTML = `
            <div style="background: #ffebee; color: #c62828; padding: 15px; border-radius: 10px; margin-top: 15px; font-weight: bold; text-align: center;">
                ❌ 錯誤 (Salah)! <br/>
                <span style="font-size: 13px; font-weight: normal; color: #555;">Kata yang benar adalah: <strong>${correctWord}</strong></span>
            </div>
        `;
    }
    
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "繼續 →";
    
    nextBtn.onclick = function() {
        if (currentIndex < currentList.length - 1) {
            currentIndex++;
            renderVocabQuiz();
            nextBtn.style.display = "none"; 
        } else {
            endVocabTestStage();
        }
    };
}

function endVocabTestStage() {
    const accuracy = Math.round((score / currentList.length) * 100);
    document.getElementById('quiz-instruction').innerText = "🎉 Tahap latihan soal kosakata telah selesai!";
    
    document.getElementById('dynamic-quiz-content').innerHTML = `
        <div style="background: #e8f4fd; padding: 25px; border-radius: 16px; text-align: center; border: 1px solid #b3e5fc;">
            <h3 style="color: #0288d1; margin-top: 0;">單元測試結果 (Hasil Latihan)</h3>
            <p style="font-size: 16px; color: #555;">Anda berhasil menjawab benar <strong>${score}</strong> dari <strong>${currentList.length}</strong> lokasi soal.</p>
            <p style="font-size: 24px; font-weight: bold; color: #0288d1; margin: 15px 0;">正確率 (Akurasi): ${accuracy}%</p>
        </div>
    `;
    
    const nextBtn = document.getElementById('quiz-next-btn');
    nextBtn.style.display = "block";
    nextBtn.innerText = "進入步驟三：語法學習 (Grammar) →";
    nextBtn.onclick = startGrammarStage; 
}

// ------------------------------------------
// TAHAP 3: STRUKTUR RUMUS GRAMMAR (Placeholder Gateway)
// ------------------------------------------
function startGrammarStage() {
    currentStage = 'grammar';
    document.getElementById('quiz-next-btn').style.display = "none";
    document.getElementById('quiz-step-label').innerText = "步驟三：語法學習 (Grammar)";
    document.getElementById('quiz-prog-fill').style.width = "60%";
    document.getElementById('quiz-instruction').innerText = "語法點析與結構培訓";
    
    document.getElementById('dynamic-quiz-content').innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <p style="color: #7f8c8d; font-style: italic;">[Tahap 3: Struktur Rumus Tata Bahasa Berdasarkan Modul Unit Sedang Disiapkan]</p>
            <button class="btn-primary full" onclick="showPage('page-dashboard')">返回單元選單 (Kembali ke Dasbor)</button>
        </div>
    `;
}

// ==========================================
// 5. AUDIO CORE CONTROL ENGINE (Standardisasi Taiwan zh-TW)
// ==========================================
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
        // Zero-Delay: Memutus paksa semua antrean audio sebelumnya agar responsif
        window.speechSynthesis.cancel(); 
        
        // Pembersihan karakter tanda miring jika ada (misal: "你/妳" hanya dibaca "你")
        let cleanText = text.includes('/') ? text.split('/')[0] : text;
        
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-TW';       // Penguncian aksen regional Taiwan untuk TOCFL
        utterance.rate = currentSpeed;  // Mengikuti preferensi pengubah kecepatan dinamis
        
        window.speechSynthesis.speak(utterance);
    }
}

// ==========================================
// 6. UTILITY AND EXIT CONTROLLER
// ==========================================
function exitQuiz() {
    if (confirm("Apakah Anda yakin ingin keluar dari bab ini? Progres pengerjaan saat ini tidak akan disimpan.")) {
        document.getElementById('quiz-next-btn').style.display = "none";
        showPage('page-dashboard');
    }
}
