import { loadHistory, addHistoryEntry, updateHistoryList, handleClearHistory, historyOpen } from './history.js';
import { adjustFontSize, resizeFont } from './fontcalc.js';
import { setMem, isMemoryKey, executeMemoryAction, memoryShow, memoryRecall, clearAllMemory } from './status.js';
import { setMainPoints, scaleMainPoints, noOverlay, placeKeys, calcNewCoordinates } from './calc.js';

console.log("--- main.js execution started ---");

// --- Global State ---
let userInput = "";
let levMode = true;
let modalIsActive = false;
let ovFlag = false;
let fullscrFlag = false;
let keys = [];
let displayCoords = [];
let Mem = [0, 0, 0, 0];
let EXCHANGE_RATE = 1.95583;
let CURRENCY_SYMBOL = '€';
let CURRENCY_LEV_SYMBOL = 'лв.';
let soundEffectsEnabled = false;
let showRateWarningEnabled = true;
let calcBottom = 0;

const displaylv = document.querySelector('#levInput');
const display = document.querySelector('#eurInput');
const calculator = document.querySelector(".calculator-img");
window.calculator = calculator; // Expose for debugging

const MainPointsO = {
    Keys: { x: 43, y: 235 },
    KeySize: { x: 84, y: 70 },
    KbdGaps: { x: 13, y: 13 },
    Display: { x: 102, y: 33 },
    Displaylv: { x: 102, y: 110 },
    DisplaySize: { x: 312, y: 57 },
    Status: { x: -10, y: 185 },
    StatusSize: { x: 45, y: 15 },
    CurrencyOffset: { x: -40, y: 15 },
    CurrencyLevOffset: { x: -40, y: 15 }
};

const defaultSettings = {
    exchangeRate: 1.95583,
    currencySymbol: '€',
    currencyLevSymbol: 'лв.',
    soundEffectsEnabled: false,
    showRateWarningEnabled: true,
    calcBottomOffset: 0,
    initialDisplay: 'lev',
    pwaInstallDeclined: false,
    calculatorSkin: 'Calculator0.png'
};

console.log(MainPointsO);
console.log(defaultSettings);

// --- Initialization ---

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('CXCalc_appSettings'));
    const settings = { ...defaultSettings, ...savedSettings };
    EXCHANGE_RATE = settings.exchangeRate;
    CURRENCY_SYMBOL = settings.currencySymbol;
    CURRENCY_LEV_SYMBOL = settings.currencyLevSymbol;
    showRateWarningEnabled = settings.showRateWarningEnabled;
    soundEffectsEnabled = settings.soundEffectsEnabled;
    calcBottom = settings.calcBottomOffset;
    levMode = (settings.initialDisplay === 'lev');

    const savedMem = JSON.parse(localStorage.getItem('CXCalc_CalcMem'));
    if (savedMem && Array.isArray(savedMem)) {
        Mem = savedMem;
        setMem(Mem);
    }

    if (calculator && settings.calculatorSkin) {
        calculator.src = settings.calculatorSkin;
    }

    document.documentElement.style.setProperty('--calc-bottom-offset', `${calcBottom}px`);
    if (EXCHANGE_RATE !== defaultSettings.exchangeRate) {
        // showWarning = true;
    }
    const savedMainPointsO = localStorage.getItem('CXCalc_MainPointsO');
    if (savedMainPointsO) {
        const parsedSettings = JSON.parse(savedMainPointsO);
        for (const key in MainPointsO) {
            if (parsedSettings[key]) {
                Object.assign(MainPointsO[key], parsedSettings[key]);
            }
        }
    }
    setMainPoints({}, MainPointsO);
}

function getImageSize() {
    return {
        width: calculator.naturalWidth,
        height: calculator.naturalHeight
    };
}

function getImageVisualSize() {
    let containerWidth = document.body.clientWidth;
    let containerHeight = document.body.clientHeight;
    let aspectRatio = calculator.naturalWidth / calculator.naturalHeight;
    let imageWidth, imageHeight;

    if (containerWidth / containerHeight > aspectRatio) {
        imageHeight = containerHeight;
        imageWidth = Math.round(containerHeight * aspectRatio);
    } else {
        imageWidth = containerWidth;
        imageHeight = Math.round(containerWidth / aspectRatio);
    }
    return { imageWidth, imageHeight };
}

// --- Core Logic ---

function formatNumber(num) {
    if (isNaN(num)) return '';
    return num.toFixed(2).replace('.', ',');
}

function parseNumber(str) {
    if (!str) return NaN;
    str = str.replace(/\s+/g, '');
    return parseFloat(str.replace(',', '.'));
}

function convertFromLevToEur(levStr) {
    let levValue = parseNumber(levStr);
    if (isNaN(levValue)) return '';
    let eurValue = levValue / EXCHANGE_RATE;
    return formatNumber(eurValue);
}

function convertFromEurToLev(eurStr) {
    let eurValue = parseNumber(eurStr);
    if (isNaN(eurValue)) return '';
    let levValue = eurValue * EXCHANGE_RATE;
    return formatNumber(levValue);
}

function groupByThree(str, dec) {
    if (str == null || str == "") return "";
    let cleanedStr = str.replace(/\s+/g, "");
    let parts = cleanedStr.split(",");
    let wholePart = parts[0];
    if (wholePart == "") wholePart = "0";
    let decimalPart = parts.length > 1 ? "," + parts[1] : "";
    let result = [];
    for (let i = wholePart.length; i > 0; i -= 3) {
        let start = Math.max(i - 3, 0);
        result.unshift(wholePart.slice(start, i));
    }
    if (dec) {
        if (decimalPart === "" || decimalPart === ",") {
            decimalPart = ",00";
        } else if (decimalPart.length === 2) {
            decimalPart += "0";
        }
    }
    result = result.join(" ") + decimalPart;
    result = result.replace(/^-\s(?=\d)/, "-");
    return result;
}


function updateDisplays(currentInput, formattedUserInput, keyPressed) {
    const isOperation = /[+\-*/]/.test(currentInput.slice(1)) || currentInput.includes('(') || currentInput.includes(')');
    const [activeDisplay, passiveDisplay] = levMode ? [displaylv, display] : [display, displaylv];
    const conversionFn = levMode ? convertFromLevToEur : convertFromEurToLev;

    activeDisplay.classList.add('active-display');
    passiveDisplay.classList.remove('active-display');

    let activeDisplayText;
    if (currentInput === "") {
        activeDisplayText = "";
    } else if (isOperation) {
        activeDisplayText = formattedUserInput;
    } else {
        activeDisplayText = groupByThree(currentInput, true);
    }
    activeDisplay.textContent = activeDisplayText;

    if (isOperation) {
        passiveDisplay.textContent = '';
    } else {
        const convertedValue = conversionFn(currentInput);
        passiveDisplay.textContent = groupByThree(convertedValue, true);
    }
    adjustFontSize(activeDisplay, passiveDisplay);
}

function toggleDisplayMode() {
    levMode = !levMode;
    const newActiveValue = levMode ? displaylv.textContent : display.textContent;
    userInput = newActiveValue.replace(/\s/g, '');
    if (userInput.endsWith(',00')) {
        userInput = userInput.slice(0, -3);
    }
    updateDisplays(userInput, userInput, 'L');
}

function appendNumber(value) {
    if (value === "€") {
        historyOpen();
        return;
    }
    if (value === "L") {
        toggleDisplayMode();
        return;
    }
    if (value === "C") {
        display.textContent = "";
        displaylv.textContent = "";
        userInput = "";
    } else if (value === "B") {
        userInput = userInput.slice(0, -1);
    } else if (value === "=") {
        if (!/[+\-*/]$/.test(userInput) && userInput.length > 0) {
            try {
                let formattedInput = userInput.replace(/,/g, '.');
                let oldUserInput = userInput.replace(/\*/g, "×").replace(/\//g, "÷");
                let result = eval(formattedInput);
                result = parseFloat(result).toFixed(2);
                userInput = result.toString().replace(/\./g, ',');
                navigator.clipboard.writeText(userInput);
                addHistoryEntry(oldUserInput, parseNumber(userInput), parseNumber(convertFromEurToLev(userInput)));
            } catch (error) {
                console.error("Грешка в изчисленията", error);
            }
        }
    } else {
        userInput += value;
    }
    const formattedUserInput = userInput.replace(/\*/g, "×").replace(/\//g, "÷");
    updateDisplays(userInput, formattedUserInput, value);
}


// --- Event Listeners ---
function setupEventListeners() {
    document.addEventListener("click", (event) => {
        // Simplified click handling
        // This will be expanded later
    });

function initializeLayout() {
        const { width, height } = getImageSize();
        const { imageWidth, imageHeight } = getImageVisualSize();
        scaleMainPoints(imageWidth / width, imageHeight / height);
        const layout = calcNewCoordinates(calculator);
        keys = layout.keys;
    window.keys = keys; // Expose for debugging
        displayCoords = layout.displayCoords;
        resizeFont();
        console.log(keys);
}

window.addEventListener("load", () => {
    document.body.style.overflow = 'auto';
    loadSettings();

    // Ensure layout is initialized only after the image is loaded
    if (calculator.complete) {
        initializeLayout();
    } else {
        calculator.addEventListener('load', initializeLayout);
    }

        document.getElementById('currency').textContent = CURRENCY_SYMBOL;
        document.getElementById('currencyLev').textContent = CURRENCY_LEV_SYMBOL;

        for (let i = 1; i <= 3; i++) {
            if (Mem[i] !== undefined && Mem[i] !== null && Mem[i] !== 0) {
            const statusElement = document.getElementById(`statusArea${i}`);
            if (statusElement) {
                statusElement.style.opacity = "1";
                statusElement.textContent = "M" + i;
            }
            }
        }
        document.body.classList.add("ready");
        appendNumber("C");
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500);
        }
    });

    window.addEventListener("resize", () => {
    initializeLayout();
        adjustFontSize(displaylv, display);
    });

    document.getElementById('saveSettings').addEventListener('click', () => {
        // This will be implemented later
    });

    document.getElementById('closeSettingsModalButton').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
        modalIsActive = false;
    });

    document.getElementById('clearHistoryButton').addEventListener('click', handleClearHistory);

    document.getElementById('closeHistoryModalButton').addEventListener('click', () => {
        document.getElementById('historyModal').style.display = 'none';
        modalIsActive = false;
    });
}


// --- App Start ---
setupEventListeners();
