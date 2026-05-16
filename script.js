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
