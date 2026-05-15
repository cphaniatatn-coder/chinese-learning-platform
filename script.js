let allData = [];
let quizData = [];
let currentList = [];
let isHintEnabled = false;

// 1. 同時載入資料邏輯
Promise.all([
    fetch('8000生詞.json').then(res => res.json()),
    fetch('output.json').then(res => res.json())
]).then(([data1, data2]) => {
    allData = data1;
    quizData = data2;
    showLevels(); 
}).catch(err => { console.error("載入失敗"); });

// 2. 顯示等級介面
function showLevels() {
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    document.getElementById('title').innerText = "請選擇學習等級";
    let html = levels.map(lv => `<button class="btn" onclick="showUnits('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 3. 顯示單元介面
function showUnits(lv) {
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    document.getElementById('title').innerText = lv + " 單元選擇";
    let html = `<button class="btn back-btn" onclick="showLevels()">← 返回等級</button>`;
    html += units.map(u => `<button class="btn btn-unit" onclick="showMenu('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 4. 四大模組主選單
function showMenu(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    document.getElementById('title').innerText = u;
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showUnits('${lv}')">← 返回單元</button>
        <button class="btn" style="background:#4a90e2" onclick="showText()">📖 課文內容</button>
        <button class="btn" style="background:#4a90e2" onclick="studyMode()">🗂️ 生詞複習</button>
        <button class="btn" style="background:#4a90e2" onclick="showGrammar()">💡 語法教學</button>
        <button class="btn" style="background:#5c6bc0" onclick="quizMode()">📝 能力測驗</button>
    `;
}

// 5. 課文閱讀模式
function showText() {
    const itemWithText = currentList.find(i => i.課文) || currentList[0];
    const text = itemWithText.課文 || "目前此單元尚未輸入課文資料。";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
        <div class="card" style="text-align:left; line-height:1.8; font-size:20px; padding:20px; border:2px solid #eee;">
            <div onmousemove="smartSearchHint(event, this.innerText)" onmouseout="hideTooltip()">
                ${text.replace(/\n/g, '<br>')}
            </div>
        </div>
        <button class="btn" style="background:#4caf50" onclick="speak('${text.replace(/\n/g, ' ')}')">📢 朗讀全課</button>
    `;
}

// 🗂️ 6. 生詞複習模式 (保留您最初始的排版，絕不改動)
function studyMode() {
    let index = 0;
    const updateCard = () => {
        const item = currentList[index];
        document.getElementById('content').innerHTML = `
            <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
            <div class="card" onmouseover="showTooltip(event, '${item.生詞}')" onmouseout="hideTooltip()">
                <div class="word">${item.生詞}</div>
                <div class="pinyin">${item.拼音}</div>
                <button class="btn" style="background:#4caf50" onclick="speak('${item.生詞}')">📢 播放語音</button>
                <hr>
                <div class="def">${item.定義}</div>
            </div>
            <button class="btn" onclick="next()">下一個 (${index + 1}/${currentList.length})</button>
        `;
    };
    window.next = () => { index = (index + 1) % currentList.length; updateCard(); };
    updateCard();
}

// 7. 語法教學模式
function showGrammar() {
    const itemWithGrammar = currentList.find(i => i.語法) || currentList[0];
    const grammar = itemWithGrammar.語法 || "目前此單元尚未輸入語法重點。";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
        <div class="card" style="text-align:left; border-left:8px solid #ff9800; padding:20px; background:#fffcf7;">
            <h3 style="color:#ff9800; margin-top:0;">💡 本課語法重點</h3>
            <p style="font-size:18px; line-height:1.6;">${grammar.replace(/\n/g, '<br>')}</p>
        </div>
    `;
}

// 8. 測驗模式
function quizMode() {
    const q = quizData[Math.floor(Math.random() * quizData.length)];
    document.getElementById('content').innerHTML = `
        <div class="card" style="padding:20px; border:2px solid #eee; margin-bottom:15px;">
            <div class="word" style="font-size:24px;" onmousemove="smartSearchHint(event, this.innerText)" onmouseout="hideTooltip()">
                ${q.問題}
            </div>
            <button class="btn" style="background:#4caf50; width:auto; margin-top:15px;" onclick="speak('${q.問題}')">📢 聽題目</button>
        </div>
        <div id="options">
            <button class="btn btn-unit" onclick="quizMode()">下一題</button>
        </div>
        <button class="btn back-btn" onclick="showMenu()">結束測驗</button>
    `;
}

// 9. 語音功能 (⚡ 已優化防延遲機制)
function speak(text) {
    if ('speechSynthesis' in window) {
        // 強制連續中止兩次，徹底沖刷掉前一個聲音的快取，解決 Delay 
        window.speechSynthesis.cancel();
        window.speechSynthesis.cancel();

        const msg = new SpeechSynthesisUtterance();
        
        // 快速過濾「你/妳」斜線邏輯
        let cleanText = text.indexOf('/') !== -1 ? text.split('/')[0] : text;
        
        msg.text = cleanText;
        msg.lang = 'zh-TW';
        msg.rate = 0.8;
        
        window.speechSynthesis.speak(msg);
    }
}

// 10. 提示開關功能
function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    if(btn) btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
}

// 11. 智慧提示邏輯
function smartSearchHint(event, text) {
    if (!isHintEnabled) return;
    const cleanText = text.replace(/[？?。，,！!]/g, "");
    
    const found = allData.find(d => {
        const wordToCheck = d.生詞.split('/')[0];
        return cleanText.includes(wordToCheck);
    });
    
    if (found) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `<b>${found.生詞}</b><br>${found.拼音}<br>${found.定義}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
    }
}

function showTooltip(event, wordText) {
    smartSearchHint(event, wordText);
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }
