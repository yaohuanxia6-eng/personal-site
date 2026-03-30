/* ========================================
   色彩炼金 - 游戏逻辑
   ======================================== */

// 游戏状态
const gameState = {
    selectedColor: null,
    steps: 0,
    testTubes: [
        { colors: [], max: 6 },
        { colors: [], max: 6 },
        { colors: [], max: 6 },
        { colors: [], max: 6 }
    ],
    savedColors: [],
    history: []
};

// DOM 元素缓存
const elements = {
    colorCards: document.querySelectorAll('.color-card'),
    savedColorsContainer: document.querySelector('.saved-colors'),
    testTubes: document.querySelectorAll('.test-tube'),
    stepCounter: document.querySelector('.step-number'),
    undoButton: document.getElementById('undo-button'),
    resetButton: document.getElementById('reset-button'),
    saveButton: document.getElementById('save-button'),
    homeButton: document.getElementById('home-button')
};

/* ========================================
   初始化
   ======================================== */

function initGame() {
    setupEventListeners();
    updateStepCounter();
    updateSavedColors();
}

function setupEventListeners() {
    // 基础色卡
    elements.colorCards.forEach(card => {
        card.addEventListener('click', () => selectColor(card.dataset.color, card.dataset.name));
    });

    // 试管
    elements.testTubes.forEach((tube, index) => {
        tube.addEventListener('click', () => pourColor(index));
    });

    // 操作按钮
    elements.undoButton.addEventListener('click', undoLastAction);
    elements.resetButton.addEventListener('click', resetGame);
    elements.saveButton.addEventListener('click', saveColor);
    elements.homeButton.addEventListener('click', goHome);

    // 弹窗
    document.getElementById('confirmSave').addEventListener('click', confirmSaveColor);
    document.getElementById('cancelSave').addEventListener('click', cancelSaveColor);
    document.getElementById('colorNameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmSaveColor();
    });
}

/* ========================================
   色卡选择
   ======================================== */

function selectColor(color, name) {
    gameState.selectedColor = { color, name };

    // 更新选中高亮
    document.querySelectorAll('.color-card').forEach(card => {
        card.classList.remove('selected');
        if (card.dataset.color === color) {
            card.classList.add('selected');
        }
    });
}

/* ========================================
   倒色与混合
   ======================================== */

function pourColor(tubeIndex) {
    if (!gameState.selectedColor) return;

    const tube = gameState.testTubes[tubeIndex];
    if (tube.colors.length >= tube.max) return;

    saveHistory();
    tube.colors.push(gameState.selectedColor.color);
    gameState.steps++;

    updateTestTube(tubeIndex);
    updateStepCounter();
}

function updateTestTube(tubeIndex) {
    const tube = gameState.testTubes[tubeIndex];
    const liquidLevel = elements.testTubes[tubeIndex].querySelector('.liquid-level');

    if (tube.colors.length === 0) {
        liquidLevel.style.height = '0';
        liquidLevel.style.backgroundColor = 'transparent';
        return;
    }

    const heightPercentage = (tube.colors.length / tube.max) * 100;
    liquidLevel.style.height = heightPercentage + '%';
    liquidLevel.style.backgroundColor = mixColors(tube.colors);
}

// RGB 均值混合算法
function mixColors(colors) {
    if (colors.length === 0) return 'transparent';
    if (colors.length === 1) return colors[0];

    let r = 0, g = 0, b = 0;
    colors.forEach(color => {
        const rgb = hexToRgb(color);
        r += rgb.r;
        g += rgb.g;
        b += rgb.b;
    });

    const count = colors.length;
    return rgbToHex(Math.floor(r / count), Math.floor(g / count), Math.floor(b / count));
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/* ========================================
   历史记录与撤回
   ======================================== */

function saveHistory() {
    gameState.history.push({
        testTubes: JSON.parse(JSON.stringify(gameState.testTubes)),
        steps: gameState.steps
    });
    if (gameState.history.length > 10) {
        gameState.history.shift();
    }
}

function undoLastAction() {
    if (gameState.history.length === 0) return;

    const lastState = gameState.history.pop();
    gameState.testTubes = lastState.testTubes;
    gameState.steps = lastState.steps;

    gameState.testTubes.forEach((_, index) => updateTestTube(index));
    updateStepCounter();
}

function updateStepCounter() {
    elements.stepCounter.textContent = gameState.steps;
}

/* ========================================
   重置游戏
   ======================================== */

function resetGame() {
    saveHistory();

    gameState.testTubes = [
        { colors: [], max: 6 },
        { colors: [], max: 6 },
        { colors: [], max: 6 },
        { colors: [], max: 6 }
    ];
    gameState.steps = 0;
    gameState.selectedColor = null;

    gameState.testTubes.forEach((_, index) => updateTestTube(index));
    updateStepCounter();

    document.querySelectorAll('.color-card').forEach(card => {
        card.classList.remove('selected');
    });
}

/* ========================================
   色卡收藏
   ======================================== */

function saveColor() {
    const selectedTubeIndex = gameState.testTubes.findIndex(tube => tube.colors.length > 0);

    if (selectedTubeIndex === -1) {
        alert('请先在试管中倒入颜色');
        return;
    }

    window.currentTubeIndex = selectedTubeIndex;
    window.currentMixedColor = mixColors(gameState.testTubes[selectedTubeIndex].colors);

    document.getElementById('saveModal').classList.add('active');
    document.getElementById('colorNameInput').focus();
}

function confirmSaveColor() {
    const colorName = document.getElementById('colorNameInput').value;

    if (!colorName || colorName.trim() === '') {
        document.getElementById('saveModal').classList.remove('active');
        return;
    }

    if (colorName.trim().length > 4) {
        alert('颜色名称最多4个字');
        return;
    }

    if (gameState.savedColors.length >= 8) {
        alert('最多只能收藏8个颜色');
        document.getElementById('saveModal').classList.remove('active');
        return;
    }

    gameState.savedColors.push({ color: window.currentMixedColor, name: colorName.trim() });

    gameState.testTubes[window.currentTubeIndex].colors = [];
    updateTestTube(window.currentTubeIndex);
    updateSavedColors();

    document.getElementById('saveModal').classList.remove('active');
    document.getElementById('colorNameInput').value = '新颜色';
}

function cancelSaveColor() {
    document.getElementById('saveModal').classList.remove('active');
    document.getElementById('colorNameInput').value = '新颜色';
}

function updateSavedColors() {
    elements.savedColorsContainer.innerHTML = '';

    // 收藏色卡（最新的在最上方）
    gameState.savedColors.forEach((savedColor, index) => {
        const colorCard = document.createElement('div');
        colorCard.className = 'color-card';
        colorCard.dataset.color = savedColor.color;
        colorCard.dataset.name = savedColor.name;
        colorCard.innerHTML = `
            <div class="color-block" style="background-color: ${savedColor.color};"></div>
            <span class="color-name">${savedColor.name} (${savedColor.color})</span>
            <span class="delete-button" data-index="${index}">×</span>
        `;

        colorCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-button')) {
                selectColor(savedColor.color, savedColor.name);
            }
        });

        colorCard.querySelector('.delete-button').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSavedColor(index);
        });

        elements.savedColorsContainer.prepend(colorCard);
    });

    // 占位卡（PC端显示，手机端CSS隐藏）
    const placeholderCount = Math.max(0, 8 - gameState.savedColors.length);
    for (let i = 0; i < placeholderCount; i++) {
        const placeholder = document.createElement('div');
        placeholder.className = 'placeholder-card';
        elements.savedColorsContainer.appendChild(placeholder);
    }
}

function deleteSavedColor(index) {
    gameState.savedColors.splice(index, 1);
    updateSavedColors();
}

/* ========================================
   导航
   ======================================== */

function goHome() {
    window.location.href = 'index.html';
}

/* ========================================
   启动
   ======================================== */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}
