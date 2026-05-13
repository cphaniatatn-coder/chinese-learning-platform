let allData = [];      // 存放生詞、課文、語法資料
let quizData = [];     // 存放測驗題目
let currentList = [];  // 當前單元的資料
let isHintEnabled = false;

// 1. 同時載入資料
Promise.all([
    fetch('8000生詞.json').then(res => res.json()),
    fetch('output.json').then(res => res.json())
]).then(([data1, data2]) => {
    allData = data1;
    quizData = data2;
    showLevels();
}).catch(err => {
    document.getElementById('content').innerText = "檔案載入出錯，請檢查 JSON 名稱。";
});

// 2. 顯示等級
function showLevels() {
    const levels = [...new Set(allData.map(item => item.序號編碼.split('-')[0]))];
    document.getElementById('title').innerText = "請選擇等級";
    let html = levels.map(lv => `<button class="btn" onclick="showUnits('${lv}')">${lv} 等級</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 3. 顯示單元
function showUnits(lv) {
    const filtered = allData.filter(item => item.序號編碼.startsWith(lv));
    const units = [...new Set(filtered.map(item => item.領域))];
    document.getElementById('title').innerText = lv + " 單元選擇";
    let html = `<button class="btn back-btn" onclick="showLevels()">← 返回等級</button>`;
    html += units.map(u => `<button class="btn btn-unit" onclick="showMenu('${lv}', '${u}')">${u}</button>`).join('');
    document.getElementById('content').innerHTML = html;
}

// 4. 單元主選單 (四大模組入口)
function showMenu(lv, u) {
    currentList = allData.filter(item => item.序號編碼.startsWith(lv) && item.領域 === u);
    document.getElementById('title').innerText = u;
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showUnits('${lv}')">← 返回單元</button>
        <button class="btn" onclick="showText('${lv}', '${u}')">📖 課文閱讀</button>
        <button class="btn" onclick="studyMode()">🗂️ 生詞卡片</button>
        <button class="btn" onclick="showGrammar('${lv}', '${u}')">💡 語法教學</button>
        <button class="btn" style="background:#5c6bc0" onclick="quizMode()">📝 能力測驗</button>
    `;
}

// 5. 模組一：課文閱讀 (假設 JSON 裡有「課文」欄位，若無則顯示生詞清單)
function showText(lv, u) {
    let textContent = currentList[0].課文 || "此單元暫無課文資料。";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu('${lv}', '${u}')">← 返回選單</button>
        <div class="card" style="text-align: left; line-height: 2;">
            <div onmousemove="smartSearchHint(event, this.innerText)" onmouseout="hideTooltip()">
                ${textContent.replace(/\n/g, '<br>')}
            </div>
        </div>
        <button class="btn" onclick="speak('${textContent}')">📢 朗讀全課</button>
    `;
}

// 6. 模組二：生詞卡片 (您原本的功能)
function studyMode() {
    let index = 0;
    const updateCard = () => {
        const item = currentList[index];
        document.getElementById('content').innerHTML = `
            <button class="btn back-btn" onclick="showMenu()">← 返回選單</button>
            <div class="card" onmouseover="showTooltip(event, '${item.生詞}')" onmouseout="hideTooltip()">
                <div class="word">${item.生詞}</div>
                <div class="pinyin">${item.拼音}</div>
                <button class="btn" style="background:#4caf50" onclick="speak('${item.生詞}')">📢 聽發音</button>
                <hr><div class="def">${item.定義}</div>
            </div>
            <button class="btn" onclick="next()">下一個 (${index + 1}/${currentList.length})</button>
        `;
    };
    window.next = () => { index = (index + 1) % currentList.length; updateCard(); };
    updateCard();
}

// 7. 模組三：語法教學 (假設 JSON 裡有「語法」欄位)
function showGrammar(lv, u) {
    let grammarContent = currentList[0].語法 || "此單元正在準備語法重點...";
    document.getElementById('content').innerHTML = `
        <button class="btn back-btn" onclick="showMenu('${lv}', '${u}')">← 返回選單</button>
        <div class="card" style="text-align: left; border-left: 5px solid #ff9800;">
            <h3>本課語法重點</h3>
            <p>${grammarContent}</p>
        </div>
    `;
}

// 8. 模組四：華語能力測驗 (對接 output.json)
function quizMode() {
    const q = quizData[Math.floor(Math.random() * quizData.length)];
    document.getElementById('content').innerHTML = `
        <div class="card">
            <div class="word" style="font-size: 24px;" onmousemove="smartSearchHint(event, '${q.問題}')" onmouseout="hideTooltip()">
                ${q.問題}
            </div>
            <button class="btn" style="background:#4caf50; width:auto;" onclick="speak('${q.問題}')">📢 聽題目</button>
        </div>
        <div id="options">
            <button class="btn btn-unit" onclick="alert('請在 JSON 增加選項欄位')">選項功能開發中</button>
        </div>
        <button class="btn" onclick="quizMode()">下一題</button>
        <button class="btn back-btn" onclick="showMenu()">結束測驗</button>
    `;
}

// 9. 工具功能 (語音、提示、智慧搜尋)
function speak(text) {
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'zh-CN';
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
}

function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
    btn.style.background = isHintEnabled ? "#4caf50" : "#ff9800";
}

function smartSearchHint(event, text) {
    if (!isHintEnabled) return;
    const cleanText = text.replace(/[？?。，,！!]/g, "");
    const found = allData.find(d => cleanText.includes(d.生詞.split('/')[0]));
    if (found) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `<b>${found.生詞}</b><br>${found.拼音}<br>${found.定義}`;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
    }
}

function hideTooltip() { document.getElementById('tooltip').style.display = 'none'; }
