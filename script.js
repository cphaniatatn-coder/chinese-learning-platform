let allData = [];      // 8000生詞庫
let quizData = [];     // 測驗題目庫
let isHintEnabled = false;

// 1. 載入資料
Promise.all([
    fetch('8000生詞.json').then(res => res.json()),
    fetch('output.json').then(res => res.json())
]).then(([data1, data2]) => {
    allData = data1;
    quizData = data2;
    showLevels();
}).catch(err => console.error("載入失敗:", err));

// 2. 顯示等級 (邏輯不變)
function showLevels() {
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    document.getElementById('title').innerText = "請選擇等級";
    let html = levels.map(lv => `<button class="btn" onclick="showUnits('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 3. 顯示單元 (邏輯不變)
function showUnits(lv) {
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    document.getElementById('title').innerText = lv + " 選擇單元";
    let html = `<button class="btn back-btn" onclick="showLevels()">← 返回</button>`;
    html += units.map(u => `<button class="btn btn-unit" onclick="startUnit('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 4. 開始單元
function startUnit(lv, u) {
    document.getElementById('content').innerHTML = `
        <button class="btn" onclick="quizMode()">📝 進入 TOCFL 測驗</button>
        <button class="btn back-btn" onclick="showUnits('${lv}')">← 返回單元</button>
    `;
}

// 5. 測驗模式 (支援選擇題 + 智慧提示)
function quizMode() {
    const q = quizData[Math.floor(Math.random() * quizData.length)];
    document.getElementById('title').innerText = "測驗中";
    
    // 建立選項按鈕 (如果 JSON 裡有選項的話)
    let optionsHtml = "";
    if(q.選項A) {
        ['A', 'B', 'C'].forEach(opt => {
            const optText = q['選項' + opt];
            if(optText) {
                optionsHtml += `<button class="btn btn-unit" onclick="checkAnswer('${opt}', '${q.答案}')">${opt}. ${optText}</button>`;
            }
        });
    }

    document.getElementById('content').innerHTML = `
        <div class="card">
            <div style="font-size: 12px; color: #999;">題號：${q.編號}</div>
            <div class="word" style="font-size: 24px; cursor: help;" 
                 onmousemove="smartSearchHint(event, '${q.問題}')" 
                 onmouseout="hideTooltip()">
                 ${q.問題}
            </div>
            <button class="btn" style="background:#4caf50; width: auto;" onclick="speak('${q.問題}')">📢 聽題目</button>
        </div>
        <div id="options-area">${optionsHtml}</div>
        <button class="btn" onclick="quizMode()">下一題</button>
        <button class="btn back-btn" onclick="showLevels()">結束練習</button>
    `;
}

function checkAnswer(userPick, correct) {
    if(userPick === correct) { alert("答對了！🌟"); } 
    else { alert("再試一次喔！加油！"); }
}

// 6. 語音 (鎖定 zh-CN, 語速 0.8)
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'zh-CN';
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
}

// 7. 提示開關
function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
    btn.style.background = isHintEnabled ? "#4caf50" : "#ff9800";
}

// 8. 智慧提示偵測 (解決您的問題 1)
function smartSearchHint(event, fullText) {
    if (!isHintEnabled) return;
    
    // 把題目裡的標點符號去掉
    const cleanText = fullText.replace(/[？?。，,！!]/g, "");
    
    // 在 8000 詞庫中找尋「出現在題目裡」的生詞
    // 優先找長詞，再找短詞
    const found = allData.filter(d => cleanText.includes(d.生詞.split('/')[0]))
                         .sort((a, b) => b.生詞.length - a.生詞.length)[0];

    if (found) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `<b>${found.生詞}</b><br>${found.拼音}<br><small>${found.定義}</small>`;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 15) + 'px';
        tooltip.style.top = (event.pageY + 15) + 'px';
    }
}

function hideTooltip() {
    document.getElementById('tooltip').style.display = 'none';
}
