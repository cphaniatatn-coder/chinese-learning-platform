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
// SYSTEM LOGGER (Fitur Deteksi Eror Otomatis)
// ==========================================
function logSystem(status, message, details = "") {
    console.log(`%c[TOCFL SYSTEM - ${status}] ${message}`, 
        status === 'SUCCESS' ? 'color: #2e7d32; font-weight: bold;' : 'color: #c62828; font-weight: bold;', 
        details
    );
}

// ==========================================
// 1. INITIALIZATION & DATA LOADING
// ==========================================
window.onload = function() {
    logSystem('INFO', 'Memulai pemuatan file 8000生詞.json...');
    
    fetch('8000生詞.json')
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
        })
        .then(data => {
            allData = data;
            logSystem('SUCCESS', `File JSON Berhasil Dimuat! Total data: ${allData.length} baris.`);
            
            // Verifikasi sampel properti data JSON Anda
            if(allData.length > 0) {
                logSystem('INFO', 'Sampel data baris pertama:', allData[0]);
            }
            
            // Menuju ke Landing Page bawaan Claude
            showPage('page-landing');
        })
        .catch(err => {
            logSystem('ERROR', 'GAGAL MEMUAT JSON! Periksa ekstensi file, koma menggantung, atau jalankan Live Server.', err.message);
            const contentDiv = document.getElementById('dash-content');
            if (contentDiv) {
                contentDiv.innerHTML = `<span style="color:red; font-weight:bold;">Eror Sistem: Gagal membaca file data. Pastikan Anda membuka proyek ini menggunakan "Live Server" di VS Code, bukan klik ganda file HTML.</span>`;
            }
        });
};

// ==========================================
// 2. SPA NAVIGATION OVERRIDE
// ==========================================
function showPage(pageId) {
    logSystem('INFO', `Mencoba berpindah ke halaman: #${pageId}`);
    
    const targetPage = document.getElementById(pageId);
    if (!targetPage) {
        logSystem('ERROR', `Halaman #${pageId} TIDAK DITEMUKAN di index.html! Periksa apakah ID elemen Anda salah ketik.`);
        return;
    }

    // Sembunyikan semua kontainer halaman
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    
    // Tampilkan halaman target
    targetPage.classList.add('active');
    logSystem('SUCCESS', `Halaman #${pageId} sekarang Aktif.`);

    // Jika masuk ke dashboard, render menu tingkat
    if (pageId === 'page-dashboard') {
        showLevelsMenu();
    }
}

// ==========================================
// 3. DASHBOARD LOGIC (Sistem Per Bab)
// ==========================================
function showLevelsMenu() {
    const dashContent = document.getElementById('dash-content');
    const dashTitle = document.getElementById('dash-title');
    
    if (!dashContent || !dashTitle) {
        logSystem('ERROR', 'Elemen #dash-content atau #dash-title tidak ditemukan di index.html!');
        return;
    }

    dashTitle.innerText = "請選擇學習等級 (Pilih Tingkat Ujian)";
    
    try {
        // Ekstraksi kode tingkat (A0, A1, A2) dari properti '序號編碼'
        const levels = [...new Set(allData.map(item => {
            if(!item.序號編碼) throw new Error("Ada data kosakata yang tidak memiliki properti '序號編碼'!");
            return item.序號編碼.split('-')[0];
        }))];
        
        let html = `<div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">`;
        html += levels.map(lv => `<button class="btn-primary" style="width:100%;" onclick="showUnitsMenu('${lv}')">${lv} 等級 (Tingkat ${lv})</button>`).join('');
        html += `</div>`;
        
        dashContent.innerHTML = html;
        logSystem('SUCCESS', 'Menu tingkat ujian berhasil di-render.');
    } catch (e) {
        logSystem('ERROR', 'Gagal merakit menu tingkat. Format kolom "序號編碼" di JSON tidak sesuai standar.', e.message);
        dashContent.innerHTML = `<span style="color:red;">Eror: Kolom properti "序號編碼" pada file JSON Anda hilang atau salah ketik.</span>`;
    }
}

function showUnitsMenu(lv) {
    currentLevel = lv;
    document.getElementById('dash-title').innerText = lv + " 課程單元選擇 (Pilihan Bab)";
    
    const filtered = allData.filter(item => item.序號編碼 && item.序號編碼.startsWith(lv));
    // Mendukung properti '單元' atau '領域' agar fleksibel
    const chapters = [...new Set(filtered.map(item => item.單元 || item.領域))];
    
    if (chapters.length === 0 || chapters[0] === undefined) {
        logSystem('ERROR', `Gagal mendeteksi Bab untuk level ${lv}. Periksa kolom "單元" atau "領域" di JSON.`);
        document.getElementById('dash-content').innerHTML = `<span style="color:red;">Eror: Properti nama bab ("單元" / "領域") tidak ditemukan dalam data level ini.</span>`;
        return;
    }

    let html = `<button class="btn-outline" style="margin-bottom: 15px;" onclick="showLevelsMenu()">← 返回等級選單</button>`;
    html += `<div style="width: 100%; display: flex; flex-direction: column; gap: 12px;">`;
    
    html += chapters.map((chap, index) => {
        return `<button class="btn-primary" style="background: #5c6bc0; width:100%;" onclick="startChapter('${lv}', '${chap}')">第 ${index + 1} 單元：${chap}</button>`;
    }).join('');
    
    html += `</div>`;
    
    document.getElementById('dash-content').innerHTML = html;
}

// ==========================================
// 4. MAIN LEARNING ENGINE
// ==========================================
function startChapter(lv, chap) {
    currentChapter = chap;
    
    currentList = allData.filter(item => {
        const itemChap = item.單元 || item.領域;
        return item.序號編碼 && item.序號編碼.startsWith(lv) && itemChap === chap;
    });
    
    logSystem('INFO', `Memulai Bab: ${chap}. Total kosakata di bab ini: ${currentList.length} kata.`);
    
    if (currentList.length === 0) {
        alert("Tidak ada kosakata yang ditemukan untuk bab ini!");
        return;
    }

    showPage('page-quiz'); 
    startVocabStage();     
}

// TAHAP 1: FLASHCARD
function startVocabStage() {
    currentStage = 'vocab';
    currentIndex = 0;
    
    document.getElementById('quiz-step-label').innerText = "步驟一：生詞學習 (Flashcard)";
    document.getElementById('quiz-prog-fill').style.width = "20%";
    document.getElementById('quiz-instruction').innerText = `單元：${currentChapter} | 請點擊字卡查看拼音與定義`;
    document.getElementById('quiz-next-btn').style.display = "none";
    
    renderFlashcardLayout();
}

function renderFlashcardLayout() {
    const item = currentList[currentIndex];
    const targetDiv = document.getElementById('dynamic-quiz-content');
    
    if (!targetDiv) {
        logSystem('ERROR', 'Elemen #dynamic-quiz-content tidak ditemukan di index.html!');
        return;
    }
    
    let html = `
        <div style="text-align:center; margin-bottom: 20px;">
            <span style="font-size:13px; color:#7f8c8d;">音速 (Kecepatan Audio): </span>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(0.6)" id="spd-0.6">0.6x 慢速</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px; background:#4caf50; color:white;" onclick="changeSpeed(0.8)" id="spd-0.8">0.8x 標準</button>
            <button class="btn-outline" style="padding: 4px 10px; width: auto; display: inline; font-size:12px;" onclick="changeSpeed(1.0)" id="spd-1.0">1.0x 考試</button>
        </div>

        <div class="flashcard" style="border: 2px solid #e0e6ed; border-radius: 16px; padding: 40px 20px; text-align: center; cursor: pointer; min-height: 180px; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.05);" onclick="toggleCardFlip()">
            <div id="fc-word" style="font-size: 48px; font-weight: bold; color: #2c3e50;">${item.生詞 || '[Kosong]'}</div>
            <div id="fc-back" style="display: none; width: 100%; margin-top: 10px;">
                <div style="font-size: 22px; color: #e67e22; font-weight: 500; margin-bottom: 8px;">${item.拼音 || '[Kosong]'}</div>
                <div style="font-size: 18px; color: #7f8c8d; border-top: 1px dashed #e0e6ed; padding-top: 8px;">${item.定義 || '[Kosong]'}</div>
            </div>
            <div style="font-size: 12px; color: #b0bec5; margin-top: 15px;">進度: ${currentIndex + 1} / ${currentList.length}</div>
        </div>

        <button class="btn-primary full" style="background:#ff9800; margin-top: 20px;" onclick="event.stopPropagation(); speakChinese('${item.生詞}')">🔊 Play Audio</button>
        <button class="btn-primary full" style="margin-top: 10px;" onclick="nextCard()">下一個 (Berikutnya) →</button>
    `;
    
    targetDiv.innerHTML = html;
    changeSpeed(currentSpeed); 
    speakChinese(item.生詞);    
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
        document.getElementById('quiz-instruction').innerText = "🎉 Semua kosakata bab ini selesai dipelajari!";
        const nextBtn = document.getElementById('quiz-next-btn');
        nextBtn.style.display = "block";
        nextBtn.innerText = "進入步驟二：生詞測試 (Latihan Soal) →";
        nextBtn.onclick = startVocabTest; 
    }
}

// TAHAP 2: TES KOSAKATA PILIHAN GANDA
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
    document.getElementById('quiz-feedback').innerHTML = "";
    
    const correctAnswerItem = currentList[currentIndex];
    let options = [correctAnswerItem];
    
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
        <div style="background: #e8f4fd; padding: 25px; border-radius: 166px; text-align: center; border: 1px solid #b3e5fc;">
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

// TAHAP 3: GRAMMAR PLACEHOLDER
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
// 5. AUDIO CORE CONTROL ENGINE (zh-TW)
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
        window.speechSynthesis.cancel(); 
        let cleanText = text.includes('/') ? text.split('/')[0] : text;
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'zh-TW';       
        utterance.rate = currentSpeed;  
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
