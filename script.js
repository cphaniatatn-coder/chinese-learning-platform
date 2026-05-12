// --- 新增：提示開關變數 ---
let isHintEnabled = false;

// 1. 切換開關按鈕
function toggleHint() {
    isHintEnabled = !isHintEnabled;
    const btn = document.getElementById('hint-toggle');
    if (btn) {
        btn.innerText = isHintEnabled ? "💡 提示：啟動中" : "💡 提示：關閉中";
        btn.style.background = isHintEnabled ? "#4caf50" : "#ff9800";
    }
}

// 2. 顯示懸浮卡片 (Tooltip)
// 老師，這段會去您的 8000 詞庫 (allData) 找資料
function showTooltip(event, wordText) {
    if (!isHintEnabled) return;
    
    // 找出該生詞的詳細資料
    const item = allData.find(d => d.生詞 === wordText || d.生詞.split('/')[0] === wordText);
    
    if (item) {
        const tooltip = document.getElementById('tooltip');
        tooltip.innerHTML = `
            <div style="font-weight:bold; color:#4a90e2; font-size:18px;">${item.生詞}</div>
            <div style="color:#e67e22;">${item.拼音}</div>
            <div style="font-size:12px; color:#666;">詞性：${item.詞性 || 'N/A'}</div>
            <hr style="margin:5px 0; border:0; border-top:1px solid #eee;">
            <div style="font-size:14px;">${item.定義}</div>
            <button onclick="speak('${item.生詞}')" style="margin-top:5px; cursor:pointer;">🔊 播放</button>
        `;
        tooltip.style.display = 'block';
        tooltip.style.left = (event.pageX + 10) + 'px';
        tooltip.style.top = (event.pageY + 10) + 'px';
    }
}

// 3. 隱藏懸浮卡片
function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) tooltip.style.display = 'none';
}
