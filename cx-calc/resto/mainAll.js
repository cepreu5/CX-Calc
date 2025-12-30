// terser mainAll.js --compress --mangle --toplevel --output mainnAll.js
const filesToCheck = [
    'index.html',
    'mainnAll.js',
    'style.css'
];

const rows = 5;
const cols = 4;
const container = document.querySelector('.calculator-container');
const displaylv = document.querySelector('#levInput');
const display = document.querySelector('#eurInput');
var calculator = null; // Изображението на калкулатора
var calcBottom = 0;
var calcLeft = 0;
var calcRight = 0;
var screenWidth = window.innerWidth;
var imageWidth, imageHeight, aspectRatioW, aspectRatioH;
var imageWidthO, imageHeightO;
var userInput = "";
var ovFlag = false, fullscrFlag = false; // Флаг за оверлей и пълен екран
var keys = displayCoords = [];
var Mem = [0, 0, 0, 0]; // Място за съхранение на паметта
var levMode = true, isStandalone = false; // Начален режим - лв.
var MainPoints = {};
let modalIsActive = false;
let layoutSettingsVisible = false; // Следи дали са показани настройките за зони (Settings2)
var showWarning = false; // Флаг за показване на предупреждение за курса
var tipsEnabled = true; // Флаг за показване на подсказки
let installPromptWasShown = false; // New global variable
// Променливи за Web Audio API за по-бърз звук
let audioContext;
let clickBuffer = null;
var handMode = 'standard'; // 'left' or 'right'
var standardKeyboard = false;

const MAX_HISTORY_ITEMS = 30;
const historyButton = document.getElementById('historyButton');
const recallButton = document.getElementById('recallButton');
//const hModalOverlay = document.getElementById('hisModalOverlay');
const settingsModal = document.getElementById('settingsModal');
const historyList = document.getElementById('historyList');
const closeHistoryModalButton = document.getElementById('closeHistoryModalButton');
const closeHelpModalButton = document.getElementById('closeHelpModalButton');
const clearHistoryButton = document.getElementById('clearHistoryButton');
const closeHelpModalButtonTop = document.getElementById('closeHelpModalButtonTop');
// Прихващане на координати и блокиране на context менюто
const ctoverlay = document.getElementById('ctoverlay');
// Блокиране на системното меню
ctoverlay.addEventListener('contextmenu', e => e.preventDefault());

var MainPointsO = {
    Keys: { x: 43, y: 235 },
    KeySize: { x: 84, y: 70 },
    KbdGaps: { x: 13, y: 13 },
    Display: { x: 102, y: 33 },
    Displaylv: { x: 102, y: 110 },
    DisplaySize: { x: 312, y: 57 },
    Status: { x: -10, y: 185 },
    StatusSize: { x: 45, y: 15 },
    CurrencyOffset: { x: -40, y: 15 },
    CurrencyLevOffset: { x: -40, y: 15 },
    Resto: { x: 11, y: -108 },
    RestoSize: { x: 459, y: 288 },
    Fields: { x: 30, y: -76 },
    FieldsSize: { x: 190, y: 60 },
    FldGaps: { x: 22, y: 34 },
};

const keyMapR = [ // Right-handed by default
    ["L", "€", "C", "B"],
    ["7", "8", "9", "="],
    ["4", "5", "6", "+"],
    ["1", "2", "3", "-"],
    ["0", ",", "/", "*"]
];

const keyMapL = [
    ["B", "C", "€", "L"],
    ["=", "7", "8", "9"],
    ["+", "4", "5", "6"],
    ["-", "1", "2", "3"],
    ["*", "/", ",", "0"]
];

const keyMapS = [
    ["€", "C", "B", "/"],
    ["7", "8", "9", "*"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ",", "L", "="]
];

var keyMap = keyMapR;

// Обект с настройките по подразбиране
const defaultSettings = {
    exchangeRate: 1.95583,
    currencySymbol: '€',
    currencyLevSymbol: 'лв.',
    soundEffectsEnabled: false,
    showRateWarningEnabled: true,
    calcBottomOffset: 0,
    calcLeftOffset: 0,
    calcRightOffset: 0,
    initialDisplay: 'lev', // 'eur' или 'lev'
    handMode: 'standard', // 'left' or 'right'
    standardKeyboard: true,
    tipsEnabled: true, // Показване на подсказки при стартиране
    pwaInstallDeclined: false,
    calculatorSkin: 'CalculatorS.png', // Скин по подразбиране
    decimalPlaces: 2 // Брой десетични знаци
};

// Инициализираме глобалните променливи директно от defaultSettings.
var EXCHANGE_RATE = defaultSettings.exchangeRate;
var CURRENCY_SYMBOL = defaultSettings.currencySymbol;
var CURRENCY_LEV_SYMBOL = defaultSettings.currencyLevSymbol;
var showRateWarningEnabled = defaultSettings.showRateWarningEnabled;
var soundEffectsEnabled = defaultSettings.soundEffectsEnabled;
var DECIMAL_PLACES = defaultSettings.decimalPlaces;
var tutorialSkinSwitch = false;
var originalOnloadHandler = null; // Ще пази оригиналния onload handler

function saveSettings() {
    settingsModal.style.opacity = '1';
    // --- ЗАПИС НА НАСТРОЙКИТЕ ---
    // 1. Актуализираме MainPointsO с новите стойности от полетата
    for (const key in MainPointsO) {
        if (MainPointsO.hasOwnProperty(key)) {
            const obj = MainPointsO[key];
            if (typeof obj === 'object' && obj !== null) {
                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        const inputId = key.toLowerCase() + prop.toUpperCase();
                        const inputElement = document.getElementById(inputId);
                        if (inputElement) {
                            const newValue = parseFloat(inputElement.value);
                            if (!isNaN(newValue)) {
                                obj[prop] = newValue;
                            }
                        }
                    }
                }
            }
        }
    }
    localStorage.setItem('CXCalc_MainPointsO', JSON.stringify(MainPointsO));

    // 2. Събираме и записваме останалите настройки в appSettings
    const currentSettings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || defaultSettings;
    // Събираме и записваме останалите настройки в appSettings
    const newAppSettings = {
        exchangeRate: parseFloat(document.getElementById('exchangeRateInput').value) || defaultSettings.exchangeRate,
        currencySymbol: document.getElementById('currencySymbolInput').value.trim() || defaultSettings.currencySymbol,
        currencyLevSymbol: document.getElementById('currencyLevSymbolInput').value.trim() || defaultSettings.currencyLevSymbol,
        showRateWarningEnabled: document.getElementById('rateWarningCheckbox').checked,
        soundEffectsEnabled: document.getElementById('soundEffectsCheckbox').checked,
        calcBottomOffset: parseInt(document.getElementById('calcBottomOffset_hidden').value, 10) || 0,
        calcLeftOffset: parseInt(document.getElementById('calcLeftOffset_hidden').value, 10) || 0,
        calcRightOffset: parseInt(document.getElementById('calcRightOffset_hidden').value, 10) || 0,
        initialDisplay: document.getElementById('initialDisplayLev').checked ? 'lev' : 'eur',
        handMode: document.getElementById('handModeLeft').checked ? 'left' : (document.getElementById('standardKeyboard').checked ? 'standard' : 'right'),
        standardKeyboard: document.getElementById('standardKeyboard').checked,
        pwaInstallDeclined: currentSettings.pwaInstallDeclined || defaultSettings.pwaInstallDeclined,
        calculatorSkin: document.getElementById('standardKeyboard').checked
            ? 'CalculatorS.png'
            : (currentSettings.calculatorSkin.includes('S.png') ? 'Calculator0.png' : currentSettings.calculatorSkin), // Запазваме текущия скин
        decimalPlaces: parseInt(document.getElementById('decimalPlacesInput').value, 10) || defaultSettings.decimalPlaces,
        tipsEnabled: false
    };
    localStorage.setItem('CXCalc_appSettings', JSON.stringify(newAppSettings));
    // --- ПРИЛАГАНЕ НА ПРОМЕНИТЕ ---
    // 3. Презареждаме страницата, за да се приложат всички промени консистентно
    console.log("Настройките са запазени. Страницата ще бъде презаредена.");
    location.reload();
    //calcResize ();
}

function populateLayoutSettings() {
    for (const key in MainPointsO) {
        if (MainPointsO.hasOwnProperty(key)) {
            const obj = MainPointsO[key];
            if (typeof obj === 'object' && obj !== null) {
                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        // Construct the ID based on the naming convention (e.g., keysX, displayY)
                        const inputId = key.toLowerCase() + prop.toUpperCase();
                        const inputElement = document.getElementById(inputId);
                        if (inputElement) {
                            inputElement.value = obj[prop];
                        }
                        // else { skip silently }
                    }
                }
            }
        }
    }
    // Попълни exchangeRateInput
    const exchangeRateInput = document.getElementById('exchangeRateInput');
    if (exchangeRateInput) {
        exchangeRateInput.value = EXCHANGE_RATE;
    }
    const calcBottomOffsetInput = document.getElementById('calcBottomOffset_hidden');
    if (calcBottomOffsetInput) {
        // Вземи текущата стойност от CSS променливата или по подразбиране 100
        const val = getComputedStyle(document.documentElement).getPropertyValue('--calc-bottom-offset').trim() || "0px";
        calcBottomOffsetInput.value = parseInt(val, 10);
        document.getElementById('calcBottomOffset').value = calcBottomOffsetInput.value;
        calcBottomOffsetInput.addEventListener('input', (e) => {
            const newOffset = e.target.value;
            document.documentElement.style.setProperty('--calc-bottom-offset', `${newOffset}px`);
            setTimeout(calcResize, 200);
            // transpView();
        });
    }
    const calcLeftOffsetInput = document.getElementById('calcLeftOffset_hidden');
    if (calcLeftOffsetInput) {
        // Вземи текущата стойност от CSS променливата или по подразбиране 100
        const val = getComputedStyle(document.documentElement).getPropertyValue('--calc-left-offset').trim() || "0px";
        calcLeftOffsetInput.value = parseInt(val, 10);
        document.getElementById('calcLeftOffset').value = calcLeftOffsetInput.value;
        calcLeftOffsetInput.addEventListener('input', (e) => {
            const newOffset = e.target.value;
            document.documentElement.style.setProperty('--calc-left-offset', `${newOffset}px`);
            setTimeout(calcResize, 200);
            // transpView();
        });
    }
    const calcRightOffsetInput = document.getElementById('calcRightOffset_hidden');
    if (calcRightOffsetInput) {
        // Вземи текущата стойност от CSS променливата или по подразбиране 100
        calcRightOffsetInput.value = calcRight;
        document.getElementById('calcRightOffset').value = calcRight;
        calcRightOffsetInput.addEventListener('input', (e) => {
            const newOffset = e.target.value;
            document.documentElement.style.setProperty('--calc-right-offset', `${newOffset}px`);
            setTimeout(calcResize, 200);
            // transpView();
        });
    }
    // Попълни currencySymbolInput
    const currencySymbolInput = document.getElementById('currencySymbolInput');
    if (currencySymbolInput) {
        currencySymbolInput.value = CURRENCY_SYMBOL;
    }
    // Попълни currencyLevSymbolInput
    const currencyLevSymbolInput = document.getElementById('currencyLevSymbolInput');
    if (currencyLevSymbolInput) {
        currencyLevSymbolInput.value = CURRENCY_LEV_SYMBOL;
    }
    // Попълни rateWarningCheckbox
    const rateWarningCheckbox = document.getElementById('rateWarningCheckbox');
    if (rateWarningCheckbox) {
        rateWarningCheckbox.checked = showRateWarningEnabled;
    }
    // Попълни soundEffectsCheckbox
    const soundCheckbox = document.getElementById('soundEffectsCheckbox');
    if (soundCheckbox) {
        soundCheckbox.checked = soundEffectsEnabled;
    }
    // Попълваме кой радио бутон за активен дисплей да бъде избран
    const initialDisplayEur = document.getElementById('initialDisplayEur');
    const initialDisplayLev = document.getElementById('initialDisplayLev');
    if (initialDisplayEur && initialDisplayLev) {
        if (levMode) {
            initialDisplayLev.checked = true;
        } else {
            initialDisplayEur.checked = true;
        }
    }

    // Попълваме кой радио бутон за ръка/клавиатура да бъде избран
    const handModeRight = document.getElementById('handModeRight');
    const handModeLeft = document.getElementById('handModeLeft');
    const standardKeyboardRadio = document.getElementById('standardKeyboard');
    if (handModeRight && handModeLeft && standardKeyboardRadio) {
        if (standardKeyboard) {
            standardKeyboardRadio.checked = true;
        } else if (handMode === 'left') {
            handModeLeft.checked = true;
        } else {
            handModeRight.checked = true;
        }
    }
    // Попълваме броя десетични знаци
    const decimalPlacesInput = document.getElementById('decimalPlacesInput');
    if (decimalPlacesInput) {
        decimalPlacesInput.value = DECIMAL_PLACES;
    }
    // --- Динамично показване на версията от localStorage ---
    const helpFooterInfo = document.getElementById('help-footer-info');
    const emailLink = `<a href="mailto:cx.sites.online@gmail.com" style="color: inherit; text-decoration: none;">cx.sites.online@gmail.com</a>`;

    // Показваме веднага версията от localStorage. Това е единственото четене при зареждане.
    const currentVersion = localStorage.getItem('CXCalc_appVersion');
    if (helpFooterInfo) {
        if (currentVersion) {
            helpFooterInfo.innerHTML = `Версия ${currentVersion} &bull; Контакт: ${emailLink}`;
        } else {
            helpFooterInfo.innerHTML = `Контакт: ${emailLink}`;
        }
    }
}

function loadSettings() {
    const savedSettings = JSON.parse(localStorage.getItem('CXCalc_appSettings'));
    // Слива запазените настройки с тези по подразбиране, за да се гарантира, че всички ключове съществуват.
    // Запазените стойности имат предимство.
    const settings = { ...defaultSettings, ...savedSettings };
    // Прилага настройките към глобалните променливи на приложението
    EXCHANGE_RATE = settings.exchangeRate;
    CURRENCY_SYMBOL = settings.currencySymbol;
    CURRENCY_LEV_SYMBOL = settings.currencyLevSymbol;
    showRateWarningEnabled = settings.showRateWarningEnabled;
    tipsEnabled = settings.tipsEnabled;
    soundEffectsEnabled = settings.soundEffectsEnabled;
    calcBottom = settings.calcBottomOffset;
    DECIMAL_PLACES = settings.decimalPlaces;
    calcLeft = settings.calcLeftOffset;
    calcRight = settings.calcRightOffset;
    // Задаваме активния дисплей при стартиране според запазената стойност
    levMode = (settings.initialDisplay === 'lev');
    handMode = settings.handMode;
    // Ensure consistency: if handMode is standard, force standardKeyboard to true
    if (handMode === 'standard') settings.standardKeyboard = true;
    standardKeyboard = settings.standardKeyboard;

    if (standardKeyboard) {
        keyMap = keyMapS;
    } else {
        keyMap = handMode === 'left' ? keyMapL : keyMapR;
    }

    // Зареждаме паметта отделно от 'CalcMem', тъй като тя се управлява от status.js
    const savedMem = JSON.parse(localStorage.getItem('CXCalc_CalcMem'));
    if (savedMem && Array.isArray(savedMem)) {
        Mem = savedMem;
    } // Ако няма запазена памет, използваме първоначално декларираната празна Mem.

    // Задаваме облика на калкулатора според запазената настройка
    if (calculator && settings.calculatorSkin) {
        let skin = settings.calculatorSkin;
        if (standardKeyboard) {
            skin = 'CalculatorS.png';
        } else {
            if (handMode === 'left') {
                skin = skin.replace('.png', 'L.png');
            }
        }
        calculator.src = skin;
    }

    // Прилага визуални настройки, които са нужни веднага при зареждане
    document.documentElement.style.setProperty('--calc-bottom-offset', `${calcBottom}px`);
    document.documentElement.style.setProperty('--calc-left-offset', `${calcLeft}px`);
    document.documentElement.style.setProperty('--calc-right-offset', `${calcRight}px`);
    // Проверява дали да покаже предупреждение за курса, ако е различен от стандартния
    if (EXCHANGE_RATE !== defaultSettings.exchangeRate) {
        showWarning = true;
    }
    // Зареждане на MainPointsO от localStorage
    const savedMainPointsO = localStorage.getItem('CXCalc_MainPointsO');
    if (savedMainPointsO) {
        const parsedSettings = JSON.parse(savedMainPointsO);
        // Дълбоко сливане на запазените настройки с тези по подразбиране.
        // Това гарантира, че нови свойства (като CurrencyOffset) се добавят,
        // дори ако потребителят има стари настройки в localStorage.
        for (const key in MainPointsO) {
            if (parsedSettings[key]) {
                // Слива индивидуалните x/y стойности, за да не се губят
                Object.assign(MainPointsO[key], parsedSettings[key]);
            }
        }
        console.log("Заредени и допълнени MainPointsO от loadSettings():");
    }
}

function getImageSize() {
    if (calculator) {
        // console.log("Извлечен път:", calculator.src); // Проверка в конзолата
        imageWidthO = calculator.naturalWidth;
        imageHeightO = calculator.naturalHeight;
        // console.log("Оригинален размер (1:1) на изображението: W:", imageWidthO, " x H:", imageHeightO);
    } else {
        console.log("Изображението не е намерено!");
    }
}

function getImageVisualSize() {
    let containerWidth = document.body.clientWidth - 1;
    let containerHeight = document.body.clientHeight;
    if (!calculator) {
        console.error("Грешка: Не е намерено изображението.");
        return;
    }

    // Reset styles
    calculator.style.maxHeight = '95%';
    calculator.style.objectPosition = 'center center';

    // Check for Resto extra height requirement
    let extraTop = 0;
    if (typeof MainPointsO !== 'undefined' && MainPointsO.Resto && MainPointsO.Resto.y < 0) {
        extraTop = Math.abs(MainPointsO.Resto.y);
        // Calculate max height for calculator image to allow space for Resto
        const calcNaturalH = calculator.naturalHeight;
        if (calcNaturalH > 0) {
            const allowedH = (containerHeight * calcNaturalH) / (calcNaturalH + extraTop) - 20;
            calculator.style.maxHeight = `${allowedH}px`;
            calculator.style.objectPosition = 'center bottom';
        }
    }

    // Initialize offsets
    window.imgOffsetX = 0;
    window.imgOffsetY = 0;

    const rect = calculator.getBoundingClientRect();
    const elWidth = rect.width;
    const elHeight = rect.height;

    let aspectRatio = calculator.naturalWidth / calculator.naturalHeight;
    if (calculator.style.objectFit === "cover") {
        imageWidth = elWidth;
        imageHeight = elHeight;
    } else if (calculator.style.objectFit === "contain") {
        if (elWidth / elHeight > aspectRatio) {
            imageHeight = elHeight;
            imageWidth = Math.round(elHeight * aspectRatio);
            // Image is narrower, centered horizontally
            window.imgOffsetX = (elWidth - imageWidth) / 2;
            console.log("(contain) - Изображението е по-широко от контейнера, използваме височината на контейнера.");
        } else {
            imageWidth = elWidth;
            imageHeight = Math.round(elWidth / aspectRatio);
            // Image is shorter.
            if (extraTop > 0) {
                // Aligned to bottom due to Resto
                window.imgOffsetY = elHeight - imageHeight;
            } else {
                // Centered vertically
                window.imgOffsetY = (elHeight - imageHeight) / 2;
            }
            console.log("(contain) - Изображението е по-високо от контейнера, използваме ширината на контейнера.");
        }
    } else {
        imageWidth = calculator.width;
        imageHeight = calculator.height;
        // console.log("(no contain) - Използваме зададените размери на изображението.");
    }
    // console.log("Визуален размер на изображението: W:", imageWidth, " x H:", imageHeight);
    // Заменяме window.innerWidth с containerWidth
    aspectRatioW = imageWidth / imageWidthO; // aspectRatioW е съотношението на ширината на изображението към оригиналната ширина
    aspectRatioH = imageHeight / imageHeightO; // aspectRatioH е съотношението на височината на изображението към оригиналната височина
    console.log("aspectRatioW = ", aspectRatioW, "   aspectRatioH = ", aspectRatioH);

    // --- Set Panel Width logic moved here ---
    // NO PANEL ANYMORE
}

function getKeyValue(row, col) {
    return keyMap[row][col];
}

function formatNumber(num) {
    if (isNaN(num)) return '';
    return num.toFixed(DECIMAL_PLACES).replace('.', ',');
}

function parseNumber(str) {
    if (!str) return NaN;
    str = str.replace(/\s+/g, ''); // Премахваме интервалите
    return parseFloat(str.replace(',', '.'));
}

function convertFromLevToEur(levStr) {
    let levValue = parseNumber(levStr);
    if (isNaN(levValue)) {
        return ''; // Изчистваме целевото поле, ако изходното е невалидно
    } else {
        let eurValue = levValue / EXCHANGE_RATE;
        return formatNumber(eurValue);
    }
}

function convertFromEurToLev(eurStr) {
    let eurValue = parseNumber(eurStr);
    if (isNaN(eurValue)) {
        return ''; // Изчистваме целевото поле, ако изходното е невалидно
    } else {
        let levValue = eurValue * EXCHANGE_RATE;
        return formatNumber(levValue);
    }
}

function groupByThree(str, dec) { // dec - дали да се добави десетична част
    if (str == null || str == "") return ""; // Ако входът е празен
    let cleanedStr = str.replace(/\s+/g, ""); // Премахваме интервалите
    let parts = cleanedStr.split(","); // Разделяме цялата и десетичната част
    let wholePart = parts[0]; // Цялата част от числото
    if (wholePart == "") wholePart = "0"; // Ако няма цяла част, връщаме празен низ
    let decimalPart = parts.length > 1 ? "," + parts[1] : ""; // Десетичната част (ако я има)
    let result = [];
    for (let i = wholePart.length; i > 0; i -= 3) {
        let start = Math.max(i - 3, 0);
        result.unshift(wholePart.slice(start, i)); // Запазваме правилния ред
    }
    // Conditional formatting of decimal part based on 'dec' flag
    if (dec) {
        // ensure two decimal places
        if (decimalPart.length - 1 < DECIMAL_PLACES) {
            if (decimalPart === "") decimalPart = ",";
            decimalPart = decimalPart.padEnd(DECIMAL_PLACES + 1, '0');
        }
    } else if (decimalPart.length > 1 && decimalPart.length - 1 > DECIMAL_PLACES) {
        decimalPart = decimalPart.substring(0, DECIMAL_PLACES + 1);
    } else {
        // If 'dec' is false, preserve the decimal part as is
        // No changes needed to decimalPart here, it already contains what was in the input string
    }
    result = result.join(" ") + decimalPart; // Свързваме групите и добавяме десетичната част
    result = result.replace(/^-\s(?=\d)/, "-"); // избягване на стърчащ минус: - 5 123,45
    return result;
}

function canAddCharacter(currentInput, nextChar) {
    const arithmeticSymbols = ['+', '-', '*', '/'];
    // Регулярният израз открива последното число с DECIMAL_PLACES цифри след запетая без аритметичен символ след него
    const regex = new RegExp(`(\\d+,\\d{${DECIMAL_PLACES}})(?![+\\-*/])`);
    // Ако последното число е във формат xxxxx,dd и:
    if (regex.test(currentInput)) {
        if (/\d/.test(nextChar)) {
            // Забраняваме добавяне на нова цифра веднага след xxxxx,dd
            return false;
        }
    }
    // Всички други случаи — разрешени
    return true;
}

function updateDisplays(userInput, formattedUserInput, keyPressed) {
    // Проверяваме дали низът съдържа оператори или скоби.
    // slice(1) се използва, за да се позволи въвеждането на отрицателно число в началото.
    // Скобите се проверяват в целия низ, защото те винаги означават израз.
    const isOperation = /[+\-*/]/.test(userInput.slice(1)) || userInput.includes('(') || userInput.includes(')');
    const [activeDisplay, passiveDisplay] = levMode ? [displaylv, display] : [display, displaylv];
    const conversionFn = levMode ? convertFromLevToEur : convertFromEurToLev;
    // Осветяване на активния дисплей
    activeDisplay.classList.add('active-display');
    passiveDisplay.classList.remove('active-display');
    let activeDisplayText;
    if (userInput === "") { // Добавена проверка за празен userInput
        activeDisplayText = "";
    } else if (isOperation) {
        activeDisplayText = formattedUserInput;
    } else {
        const hasComma = userInput.includes(',');
        const decimalPart = hasComma ? userInput.split(',')[1] : '';
        const isWholeNumber = !hasComma;
        if (keyPressed === "B") { // Режим на изтриване (Backspace)
            if (isWholeNumber) { // Ако след изтриване числото е цяло (напр. от "12," става "12")
                activeDisplayText = groupByThree(userInput, true); // Форматираме го като "12,xx"
            } else { // Ако все още има десетична част (напр. "12,34" -> "12,3" или "12,3" -> "12,")
                activeDisplayText = groupByThree(userInput, false); // Показваме го точно както е
            }
        } else { // Режим на нормално въвеждане (цифра или запетая)
            if (isWholeNumber) { // Ако е цяло число (напр. "12")
                activeDisplayText = groupByThree(userInput, true); // Форматираме го като "12,xx"
            } else if (decimalPart.length === 0) { // Ако има запетая, но без десетични цифри (напр. "12,")
                activeDisplayText = groupByThree(userInput, true); // Показваме го като "12,"
            } else if (decimalPart.length === 1) { // Ако има една десетична цифра (напр. "12,3")
                activeDisplayText = groupByThree(userInput, true); // Форматираме го като "12,30"
            } else { // Ако има две десетични цифри (напр. "12,34")
                activeDisplayText = groupByThree(userInput, false); // Показваме го като "12,34"
            }
        }
    }
    activeDisplay.textContent = activeDisplayText;
    // Задаване на текст за пасивния дисплей (или изчистване при операция)
    if (isOperation) {
        passiveDisplay.textContent = '';
    } else {
        const convertedValue = conversionFn(userInput);
        passiveDisplay.textContent = groupByThree(convertedValue, true); // Пасивният дисплей винаги показва два десетични знака
    }
    // Адаптиране на шрифта
    adjustFontSize(activeDisplay, passiveDisplay);
}

function toggleDisplayMode() {
    // Toggle Resto Panel and Image visibility
    const restoImage = document.getElementById('restoImage');
    const inputsContainer = document.getElementById('restoInputs');

    let isVisible = false;
    if (inputsContainer && inputsContainer.style.display !== 'none') {
        isVisible = true;
    }

    if (isVisible) {
        // Hide
        if (restoImage) restoImage.style.display = 'none';
        if (inputsContainer) inputsContainer.style.display = 'none';
    } else {
        // Show
        if (restoImage) {
            restoImage.style.display = 'block';
            restoImage.style.pointerEvents = 'auto'; // Block clicks on the image area
        }
        if (inputsContainer) {
            inputsContainer.style.display = 'block';

            // Check if upper display has a valid number and populate due1
            const upperDisplay = document.getElementById('eurInput');
            const due1 = document.getElementById('due1');
            if (upperDisplay && due1) {
                let val = upperDisplay.textContent.replace(/\s/g, '');
                // Check for only numbers, comma or dot (no operators, no minus unless implied ok, but user said "only numbers")
                if (val && /^[\d,.]+$/.test(val)) {
                    due1.value = val;
                    // Trigger input event to update calculations
                    due1.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
            // Inputs inside are absolute positioned by calcResize
            setTimeout(() => {
                const firstInput = document.getElementById('due1');
                if (firstInput) firstInput.focus();
            }, 50);
        }
    }

    // Recalculate layout to ensure overlays match any potential shifts
    setTimeout(calcResize, 10);
}

function balanceBrackets(str) {
    let open = 0;
    for (const c of str) if (c === '(') open++; else if (c === ')') open--;
    return str + ')'.repeat(Math.max(0, open));
}

function addImplicitMultiplication(expression) {
    // 3( -> 3*( | )3 -> )*3 | )( -> )*(
    return expression
        .replace(/(\d)(?=\()/g, '$1*')   // Digit followed by (
        .replace(/(?<=\))(\d)/g, '*$1')   // Digit preceded by )
        .replace(/\)\( /g, ')*(');        // A ) followed by a (
}

function appendNumber(value) {
    var oldUserInput = "";
    const display = document.getElementById('eurInput');
    const displaylv = document.getElementById('levInput');
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
                // console.log("Изчисляване на:", formattedInput);
                oldUserInput = userInput
                    .replace(/\*/g, "×")
                    .replace(/\//g, "÷")
                    .replace(/,/g, '.');
                formattedInput = addImplicitMultiplication(balanceBrackets(formattedInput));
                // console.log("1-Изчисляване на:", formattedInput);
                let result = eval(formattedInput);
                result = parseFloat(result).toFixed(DECIMAL_PLACES);
                userInput = result.toString().replace(/\./g, ',');
                navigator.clipboard.writeText(userInput)
                    .then(() => {
                        console.log("Резултатът е копиран в клипборда! ✅");
                    })
                    .catch(err => { console.error("Грешка при копиране в клипборда:", err); });
            } catch (error) {
                console.error("Грешка в изчисленията", error);
            }
        }
    } else {
        // Ограничение до два знака след запетаята само за текущото число
        const lastOperatorIndex = Math.max(
            userInput.lastIndexOf('+'),
            userInput.lastIndexOf('-'),
            userInput.lastIndexOf('*'),
            userInput.lastIndexOf('/')
        );
        const currentNumber = lastOperatorIndex === -1
            ? userInput
            : userInput.slice(lastOperatorIndex + 1);
        // Не допускаме повече от една запетая в текущото число
        if (value === "," && currentNumber.includes(',')) return;
        // Ограничение за два знака след запетаята само за текущото число
        if ((/\d/.test(value) || value === ",") && currentNumber.includes(',')) {
            const decimalPart = currentNumber.split(',')[1] || "";
            if (decimalPart.length >= DECIMAL_PLACES) return;
        }
        // Не допускаме аритметични знаци в началото на израза или след друг оператор
        if (/[+\-*/]/.test(value) && (userInput.length === 0 || /[+\-*/]$/.test(userInput))) return;
        // Проверка за автоматично изчисление при въвеждане на втори оператор
        let match = userInput.match(/([\d,]+[+\-*/])([\d,]+)/);
        if (match && /[+\-*/]/.test(value)) {
            try {
                //let formattedInput = match[0].replace(/,/g, '.');
                let formattedInput = userInput.replace(/,/g, '.');
                oldUserInput = userInput
                    .replace(/\*/g, "×")
                    .replace(/\//g, "÷")
                    .replace(/,/g, '.');
                formattedInput = addImplicitMultiplication(balanceBrackets(formattedInput));
                console.log("2-Изчисляване на:", formattedInput);
                let result = eval(formattedInput);
                userInput = parseFloat(result).toFixed(DECIMAL_PLACES).replace(/\./g, ',') + value;
                let levValue = parseNumber(displaylv.textContent);
                let eurValue = parseNumber(display.textContent);
                addHistoryEntry(oldUserInput, result, "no"); // записва междинен резултат
            } catch (error) {
                console.error("Грешка в изчисленията", error);
            }
        } else {
            // Предотвратяване на водещи нули (напр. 04 -> 4 или 5+04 -> 5+4)
            if (currentNumber === '0' && value !== ',' && !/[+\-*/]/.test(value)) {
                // Заменяме '0' с новата цифра, вместо да я добавяме
                userInput = userInput.slice(0, -1) + value;
            } else if (canAddCharacter(userInput, value)) {
                userInput += value;
            }
        }
    }
    const formattedUserInput = userInput
        .replace(/\*/g, "×")
        .replace(/\//g, "÷");
    updateDisplays(userInput, formattedUserInput, value);
    if (value === "=") {
        let levValue = parseNumber(displaylv.textContent);
        let eurValue = parseNumber(display.textContent);
        if (levValue !== "" && eurValue !== "") addHistoryEntry(oldUserInput, levValue, eurValue);
    }
    if (userInput.endsWith(','.padEnd(DECIMAL_PLACES + 1, '0'))) {
        userInput = userInput.slice(0, -(DECIMAL_PLACES + 1));
    }
    console.log("userInput = ", userInput);
}

function getKeyColumnIndex(key) {
    const rect = calculator.getBoundingClientRect();
    const colWidth = MainPoints.KeySize.x + MainPoints.KbdGaps.x;
    const relativeX = (key.x - rect.left - MainPoints.Keys.x) / colWidth;
    return Math.round(relativeX + 1); // Връща 1, 2, 3 или 4
}

function controlActions(key) {
    if (key.value === '+') {
        if (!fullscrFlag) goFullscreen()
        else exitFullscreen();
        fullscrFlag = !fullscrFlag;
    } else if (key.value === '*') {
        console.log("Before %: ", userInput);
        userInput = userInput.replace(',', '.');
        userInput = eval(userInput);
        userInput = (parseFloat(userInput) / 100)
            .toFixed(DECIMAL_PLACES)
            .replace('.', ',');
        appendNumber("=");
        // console.log("Ctrl+%: ", userInput);
    } else if (key.value === '-') {
        if ((/[+\-*/]$/.test(userInput))) return;
        if (userInput.startsWith("-")) {
            userInput = userInput.slice(1); // премахва първия символ "-"
        } else {
            userInput = "-" + userInput;    // добавя "-"
        }
        userInput = userInput.replace(',', '.');
        if ((/[+\-*/]$/.test(userInput))) return;
        userInput = eval(userInput);
        userInput = (parseFloat(userInput))
            .toFixed(DECIMAL_PLACES)
            .replace('.', ',');
        appendNumber("=");
    }
}

// Инициализира Web Audio API за бързо възпроизвеждане на звук
async function initAudio() {
    if (!soundEffectsEnabled) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Изтегляме и декодираме аудио файла предварително
        const response = await fetch('click.wav');
        const arrayBuffer = await response.arrayBuffer();
        clickBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("Аудио файлът е кеширан и готов за възпроизвеждане.");
    } catch (e) {
        console.error("Web Audio API не се поддържа или възникна грешка при инициализация.", e);
        soundEffectsEnabled = false; // Деактивираме звука при грешка
    }
}

function playClickSound() {
    if (!soundEffectsEnabled || !clickBuffer || !audioContext) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    const source = audioContext.createBufferSource();
    source.buffer = clickBuffer;
    source.connect(audioContext.destination);
    source.start(0);
}

function getKeyDimensions() {
    const rect = calculator.getBoundingClientRect();
    const scaleX = rect.width / imageWidthO;
    const scaleY = rect.height / imageHeightO;
    return {
        keyWidth: MainPointsO.KeySize.x * scaleX,
        keyHeight: MainPointsO.KeySize.y * scaleY
    };
}

function isWithinKeyBounds(event, key, keyWidth, keyHeight) {
    return (
        event.clientX >= key.x &&
        event.clientX <= key.x + keyWidth &&
        event.clientY >= key.y &&
        event.clientY <= key.y + keyHeight
    );
}

function handleStatusZones(event, isCtrlRequired) {
    for (let i = 1; i <= 4; i++) {
        const statusEl = document.getElementById(`statusArea${i}`);
        if (!statusEl) continue; // Прескачаме, ако елементът не съществува
        // За слотове 1-3, зоната трябва да е видима. За слот 4 (Help), тя е винаги активна.
        const isClickable = getComputedStyle(statusEl).opacity > 0 || i === 4;
        if (isClickable) {
            const rect = statusEl.getBoundingClientRect();
            const withinBounds = (
                event.clientX >= rect.left &&
                event.clientX <= rect.right &&
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom
            );
            if (withinBounds) {
                if (i === 4) {
                    if (isCtrlRequired) {
                        memoryShow(4); // Смяна на скин
                    } else {
                        if (helpModal) {
                            helpModal.classList.remove('show-content');
                            helpModal.style.display = 'flex';
                            modalIsActive = true;
                            updateRestoInputState(true);
                            setTimeout(() => {
                                if (helpModal.style.display === 'flex') {
                                    helpModal.classList.add('show-content');
                                }
                            }, 3000);
                        }
                    }
                    return true; // Кликът е обработен
                } else { // i е 1, 2, или 3
                    isCtrlRequired ? memoryShow(i) : memoryRecall(i);
                    return true; // Кликът е обработен
                }
            }
        }
    }
    return false; // Кликът не е върху активна статус зона
}

function sanitizeAndEvaluateInput(input, operationType) {
    if ((/[+\-*/]$/.test(input))) return null;
    input = input.replace(',', '.');
    let result = eval(input);
    if (operationType === 'percent') {
        result = result / 100;
    } else if (operationType === 'negate') {
        result = input.startsWith('-') ? input.slice(1) : '-' + input;
        result = eval(result); // отново evaluate след добавяне/премахване
    }
    return parseFloat(result).toFixed(DECIMAL_PLACES).replace('.', ',');
}

function goFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) {
        el.requestFullscreen();
    } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
    } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

function toggleFullscreen() {
    if (!fullscrFlag) goFullscreen();
    else exitFullscreen();
    fullscrFlag = !fullscrFlag;
}

function clearAllMemory() {
    for (let i = 1; i < 4; i++) {
        Mem[i] = 0;
        clearStatus(i);
    }
    localStorage.setItem('CXCalc_CalcMem', JSON.stringify(Mem));
}

async function pasteNumber() {
    try {
        const clipboardText = await navigator.clipboard.readText();
        const cleanedText = clipboardText.replace(/(?<=\d)\s+(?=\d)/g, '');
        const match = cleanedText.match(/-?\d+[.,]?\d*/);
        if (match) {
            let rawNumber = match[0];
            let normalized = rawNumber.replace(',', '.');
            let rounded = parseFloat(normalized).toFixed(DECIMAL_PLACES);
            let formatted = rounded.replace('.', ',');
            const lastChar = formatted.slice(-1);
            const base = formatted.slice(0, -1);
            userInput = base;
            appendNumber(lastChar);
        } else {
            console.warn("Не е намерено валидно число в клипборда.");
        }
    } catch (err) {
        console.error("Грешка при достъп до клипборда:", err);
    }
}

// Нова функция, която възстановява старата функционалност за смяна на дисплеите
function swapDisplays() {
    levMode = !levMode;
    const newActiveValue = levMode
        ? displaylv.textContent
        : display.textContent;
    userInput = newActiveValue.replace(/\s/g, '');
    if (userInput.endsWith(','.padEnd(DECIMAL_PLACES + 1, '0'))) {
        userInput = userInput.slice(0, -(DECIMAL_PLACES + 1));
    }
    updateDisplays(userInput, userInput.replace(/\*/g, "×").replace(/\//g, "÷"), 'L');
}

function switchNumber() {
    appendNumber("="); // за да запомним числото от активния дисплей в клипборда
    appendNumber("C"); // изтриваме дисплея
    swapDisplays();    // превключваме дисплея (стара функционалност)
    pasteNumber(); // поставяме числото от клипборда
}

function getCurrentDateTimeInfo() {
    const daysBg = [
        "неделя", "понеделник", "вторник", "сряда",
        "четв.", "петък", "събота"
    ];
    const now = new Date();
    const dayOfWeek = daysBg[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const date = `${day}.${month}.${year}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return `${dayOfWeek}, 📆${date}, ${time}⌚`
}

function allClear() {
    appendNumber("C"); // изтриваме дисплея
    userInput = ""; // изчистваме userInput
    Mem = [0, 0, 0, 0]; // изчистваме паметта
    localStorage.setItem('CXCalc_CalcMem', JSON.stringify(Mem)); // запазваме паметта
    document.getElementById("clearHistoryButton").click(); // изтриваме историята, ако е налична
}

function resetCalc() {
    if (confirm('Сигурни ли сте, че искате да върнете първоначалните настройки?')) {
        // Добавяме и изтриване на историята при нулиране
        if (typeof clearHistory === 'function') {
            clearHistory();
            console.log('Историята е изтрита.');
        }
        localStorage.removeItem('CXCalc_MainPointsO');
        localStorage.removeItem('CXCalc_appSettings');
        console.log('Всички запазени настройки (CXCalc_MainPointsO, CXCalc_appSettings) са изтрити.');
        location.reload();
    }
}

function handleCalculatorInteraction(event, options = {}) {
    // Ако е активен модален прозорец, прекратяваме всякаква обработка на калкулатора.
    if (modalIsActive) {
        return;
    }

    let interactionHandled = false;
    const { keyWidth, keyHeight } = getKeyDimensions();
    keys.forEach(key => {
        if (isWithinKeyBounds(event, key, keyWidth, keyHeight)) {
            interactionHandled = true;
            const keyValue = key.value;

            // --- Resto Input Interception ---
            // If the user has focused a resto field, try to send the calculator key there.
            // If handleRestoInput returns true, it means it handled the key (digit, C, Backspace),
            // so we should NOT perform the default calculator action.
            if (typeof window.handleRestoInput === 'function' &&
                !(event.ctrlKey || options.allowWithoutCtrl) && // Only intercept normal clicks, not Ctrl actions
                window.handleRestoInput(keyValue)) {
                return;
            }

            // If not handled by Resto, ensure we clear Resto focus
            if (typeof window.clearRestoFocus === 'function') {
                window.clearRestoFocus();
            }

            // Обработка на специални клавиши (The original else if chain follows)
            if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '€') {
                if (ovFlag) { noOverlay(); ovFlag = false; }
                settingsModal.style.display = 'flex';
                modalIsActive = true;
                updateRestoInputState(true);
                populateLayoutSettings();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'B') {
                clearAllMemory();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '0') {
                appendNumber("(");
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === ',') {
                appendNumber(")");
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '+') {
                pasteNumber();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '/') {
                toggleFullscreen();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'L') {
                switchNumber();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'C') {
                allClear();
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '=') {
                const DT = getCurrentDateTimeInfo();
                tempShow(DT, 5);
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '*') {
                const result = sanitizeAndEvaluateInput(userInput, 'percent');
                if (result !== null) {
                    userInput = result;
                    appendNumber("=");
                }
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '-') {
                const result = sanitizeAndEvaluateInput(userInput, 'negate');
                if (result !== null) {
                    userInput = result;
                    appendNumber("=");
                }
            } else if ((event.ctrlKey || options.allowWithoutCtrl) && isMemoryKey(keyValue)) {
                const col = getKeyColumnIndex(key);
                executeMemoryAction(keyValue, col);
            } else {
                appendNumber(keyValue);
            }
        }
    });
    // Обработка на статус зони
    if (handleStatusZones(event, event.ctrlKey || options.allowWithoutCtrl)) {
        interactionHandled = true;
    }
    // Обработка на клик върху дисплеите
    if (!interactionHandled) {
        const levDisplayEl = document.getElementById('levInput');
        const eurDisplayEl = document.getElementById('eurInput');
        const levRect = levDisplayEl.getBoundingClientRect();
        const eurRect = eurDisplayEl.getBoundingClientRect();
        const isClickOnLev = event.clientX >= levRect.left && event.clientX <= levRect.right &&
            event.clientY >= levRect.top && event.clientY <= levRect.bottom;
        const isClickOnEur = event.clientX >= eurRect.left && event.clientX <= eurRect.right &&
            event.clientY >= eurRect.top && event.clientY <= eurRect.bottom;
        if ((isClickOnLev || isClickOnEur)) { //  && (event.ctrlKey || options.allowWithoutCtrl)
            if (typeof window.clearRestoFocus === 'function') {
                window.clearRestoFocus();
            }
            userInput = "";
            swapDisplays();
            interactionHandled = true;
        }

    }
    // Ако кликът е извън контейнера на калкулатора и е Ctrl+Click или задържане
    if (!interactionHandled && (event.ctrlKey || options.allowWithoutCtrl)) {
        const calculatorContainer = document.getElementById('calculatorContainer');
        const containerRect = calculatorContainer.getBoundingClientRect();
        const isOutsideContainer = event.clientX < containerRect.left ||
            event.clientX > containerRect.right ||
            event.clientY < containerRect.top ||
            event.clientY > containerRect.bottom;
        if (isOutsideContainer) resetCalc();
    }
    // Звук, ако е имало валидно взаимодействие
    if (interactionHandled) {
        playClickSound();
    }
}

let pressTimer;
// const element = document.getElementById('calculator');
const element = document.getElementById('ctoverlay');
const longPressThreshold = 500; // milliseconds
let isLongPress = false; // Флаг, който следи дали е имало задържане
var isFullyLoaded = false;

// ТОЗИ LISTENER ЗАМЕСТВА СТАРИЯ document.addEventListener("click", ...)
document.addEventListener("click", function (event) {
    // Ако предходното действие е било задържане, не прави нищо.
    if (isLongPress) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    // --- Fix for Resto Panel Focus ---
    // If the click is inside the resto panel or an input field, do nothing (let the browser handle focus)
    if (event.target.closest('.panel') || event.target.tagName === 'INPUT') {
        return;
    }

    handleCalculatorInteraction(event);
    // updateDebugInfo();
});

document.addEventListener("contextmenu", function (event) {
    event.preventDefault(); // Винаги блокираме менюто
    // Ако задържането вече е обработено от setTimeout, не правим нищо
    if (isLongPress) {
        return;
    }
    // Ако contextmenu се изпълни пръв, изчистваме таймера,
    // за да не се изпълни действието втори път.
    clearTimeout(pressTimer);
    handleCalculatorInteraction(event, { allowWithoutCtrl: true });
});

element.addEventListener('touchstart', (e) => {
    isLongPress = false; // Нулираме флага при всяко ново докосване
    pressTimer = setTimeout(() => {
        // Установяваме, че действието е задържане
        isLongPress = true;

        // Тъй като 'e' е TouchEvent, трябва да подадем правилните координати
        const touch = e.touches[0] || e.changedTouches[0];
        const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, ctrlKey: true }; // Симулираме Ctrl+Click

        handleCalculatorInteraction(fakeEvent, { allowWithoutCtrl: true });
        console.log('Long press detected!');
    }, longPressThreshold);
});

element.addEventListener('touchend', (e) => {
    clearTimeout(pressTimer);
    // Важно: Предотвратяваме 'click' само ако е имало задържане
    if (isLongPress) {
        e.preventDefault();
    }
});

element.addEventListener('touchmove', () => {
    // Ако пръстът се премести, отменяме таймера
    clearTimeout(pressTimer);
});

document.getElementById('saveSettings').addEventListener('click', function (e) {
    saveSettings();
    settingsModal.style.display = 'none'; // Close modal after saving
    updateRestoInputState(false);
    setTimeout(() => {
        modalIsActive = false;
    }, 0);
    e.stopPropagation();
    e.preventDefault();
});

document.getElementById('closeSettingsModalButton').addEventListener('click', function (e) {
    settingsModal.style.display = 'none'; // Close modal without saving
    resetLayoutSettingsView();
    updateRestoInputState(false);
    setTimeout(() => {
        modalIsActive = false;
    }, 0);
    e.stopPropagation();
    e.preventDefault();
    // location.reload();
});

window.addEventListener("load", function () {
    // Приложението е заредило успешно.
    // 1. Връщаме възможността за скролиране, която беше спряна от вградения CSS.
    document.body.style.overflow = 'auto';
    // 2. Премахваме предпазния механизъм (таймера).
    clearTimeout(loadingTimeout);

    try {
        calculator = document.querySelector(".calculator-img");

        const initializeCalculatorLayout = () => {
            // Изчисленията вече се правят СЛЕД като изображението е заредено,
            // което гарантира коректни размери, независимо от скина.
            getImageSize();
            getImageVisualSize();

            scaleMainPoints(aspectRatioW, aspectRatioH);
            const layout = calcNewCoordinates();
            keys = layout.keys;
            displayCoords = layout.displayCoords;
            adjustFontSize(displaylv, display);
        };

        // Закачаме event listener ПРЕДИ да сменим src, за да сме сигурни, че ще се задейства.
        calculator.onload = initializeCalculatorLayout;

        // Първо зареждаме настройките, което може да смени calculator.src и да задейства .onload
        loadSettings();

        // Ако изображението вече е в кеша, .onload може да не се задейства.
        // Затова правим ръчна проверка и извикваме функцията.
        if (calculator.complete) {
            initializeCalculatorLayout();
        }

        initAudio();

        // Прилагаме символите за валута
        document.getElementById('currency').textContent = CURRENCY_SYMBOL;
        document.getElementById('currencyLev').textContent = CURRENCY_LEV_SYMBOL;

        // --- ПРЕДУПРЕЖДЕНИЕ ЗА КУРСА ---
        if (showWarning && showRateWarningEnabled) {
            //const originalTipsEnabled = tipsEnabled;
            //tipsEnabled = false;

            const warning = document.getElementById('exchangeRateWarning');
            // Тъй като HTML вече е с правилната структура (.modal),
            // просто трябва да го покажем и да закачим event handlers.
            const closeWarning = (event) => {
                // Спираме разпространението на клика, за да не задейства бутони под модала.
                if (event) event.stopPropagation();
                warning.style.display = 'none';
                updateRestoInputState(false);
                modalIsActive = false;
            };

            warning.style.display = 'flex'; // Показваме модала
            updateRestoInputState(true);
            modalIsActive = true;
            document.getElementById('exchangeRateChangeBtn').onclick = function (event) {
                if (event) event.stopPropagation();
                const settings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || defaultSettings;
                settings.exchangeRate = defaultSettings.exchangeRate;
                settings.currencySymbol = defaultSettings.currencySymbol;
                settings.currencyLevSymbol = defaultSettings.currencyLevSymbol;
                localStorage.setItem('CXCalc_appSettings', JSON.stringify(settings));
                location.reload(); // Презареждането ще скрие модала
            };
            document.getElementById('exchangeRateConfirmBtn').onclick = function (event) {
                closeWarning(event);
            };
            // tipsEnabled = originalTipsEnabled; // Възстановяваме първоначалното състояние на tipsEnabled
        }
        // --- START OF TIPS INTEGRATION ---
        if (typeof initTips === 'function' && typeof showTips === 'function') {
            initTips();
            if (tipsEnabled) { // Will be true on first ever run
                // Introduce a small delay to allow PWA banner to render first
                setTimeout(() => {
                    tutorialSkinSwitch = true;
                    memoryShow(4, showTips); // Switch skin, then start tutorial
                }, 200); // 200ms delay
            }
        }
        // --- END OF TIPS INTEGRATION ---

        // Визуализираме заредената памет
        for (let i = 1; i <= 3; i++) {
            if (Mem[i] !== undefined && Mem[i] !== null && Mem[i] !== 0) {
                memoryAdd(i, "+");
            }
        }
    } catch (err) {
        console.warn("⚠️ Грешка при инициализация:", err);
    }
    // Показване на интерфейса и задаване на активен дисплей
    document.body.classList.add("ready");
    appendNumber("C");
    // Скриване на съобщението за зареждане
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        // Плавно изчезване
        loadingOverlay.style.opacity = '0';
        setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500); // Премахваме го след анимацията
    }
    isFullyLoaded = true;
    console.log("Calculator is fully loaded and ready for interaction.");
    storeCurrentFileSizes();
    // --- PWA Install Prompt Logic for iOS ---
    // Логиката е тук, за да сме сигурни, че loading overlay е изчезнал
    // и банерът е достъпен за клик.
    isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const installDeclined = localStorage.getItem('CXCalc_pwaInstallDeclined') === 'true';

    // Показваме специални инструкции за iOS, тъй като beforeinstallprompt не се поддържа.
    if (isIOS && !isStandalone && !installDeclined) {
        const iosPrompt = document.getElementById('ios-install-prompt');
        const dismissIosBtn = document.getElementById('dismiss-ios-prompt');
        const declineIosBtn = document.getElementById('decline-ios-install');
        // const countdownSpan = document.getElementById('countdownSpan');


        if (iosPrompt && dismissIosBtn && declineIosBtn) {
            installPromptWasShown = true; // Set flag
            setupDismissablePrompt(iosPrompt, dismissIosBtn, declineIosBtn); // , countdownSpan
        }
    }
    // Задаваме началното състояние на дисплеите, СЛЕД като настройките са заредени.
    // Използваме леко закъснение и симулираме resize, за да сме сигурни, че всичко е наместено.
    setTimeout(() => {
        calcResize();
        window.dispatchEvent(new Event('resize'));
    }, 100);
    appendNumber("C");
});

document.addEventListener('DOMContentLoaded', () => {
    // --- Универсално затваряне на модален прозорец при клик извън съдържанието ---
    // Този listener е закачен за целия документ и работи за всички елементи с клас .modal
    document.addEventListener('click', (event) => {
        // Проверяваме дали е кликнато директно върху овърлея на модален прозорец (който има клас .modal)
        // event.target е самият .modal елемент, а не .modal-content
        if (event.target.classList.contains('modal')) {
            // Ключова стъпка: Спираме разпространението на събитието.
            // Това предотвратява "пробиването" на клика до елементите под модала (напр. бутоните на калкулатора),
            // след като модалът бъде скрит.
            event.stopPropagation();

            // Скриваме модалния прозорец
            if (event.target.id !== 'settingsModal') event.target.style.display = 'none';

            // Ако е бил прозорецът за настройки, връщаме го в начален изглед
            if (event.target.id === 'settingsModal') {
                resetLayoutSettingsView();
            }
            updateRestoInputState(false);
            // Деактивираме флага за модален прозорец
            modalIsActive = false;
        }
    });
    document.addEventListener('keydown', (e) => {
        const key = e.key;
        // Escape винаги работи за затваряне на модални прозорци
        if (key === 'Escape' || key === 'Esc') {
            if (settingsModal.style.display !== 'none') {
                resetLayoutSettingsView();
            }
            historyModal.style.display = 'none';
            helpModal.style.display = 'none';
            settingsModal.style.display = 'none';
            updateRestoInputState(false);
            modalIsActive = false;
            return;
        }
        // Блокираме другите клавиши, ако има отворен модален прозорец
        if (modalIsActive) {
            updateRestoInputState(true);
            return;
        }

        // --- Fix for Resto Panel Typing ---
        // Ако потребителят пише в текстово поле, не задействаме калкулатора
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        // Предотвратяваме стандартното поведение, ако е нужно
        if (['Enter', '/', '*', '(', ')'].includes(key)) {
            e.preventDefault();
        }
        // Специална обработка за '%'
        if (key === '%') {
            if ((/[+\-*/]$/.test(userInput))) return;
            userInput = userInput.replace(',', '.');
            userInput = eval(userInput);
            userInput = (parseFloat(userInput) / 100).toFixed(DECIMAL_PLACES).replace('.', ',');
            appendNumber("=");
            return;
        }
        // Специална обработка за клавиатурата
        const keyMap = { 'Enter': '=', 'Backspace': 'B', 'Delete': 'B', '.': ',', ',': ',', 'c': 'C' };
        if (keyMap[key]) {
            appendNumber(keyMap[key]);
        } else if ("0123456789+-*/".includes(key)) {
            appendNumber(key);
        }
    });

    // Добавяме слушател за бутона за проверка на версия
    const checkVersionBtn = document.getElementById('checkVersionBtn');
    if (checkVersionBtn) checkVersionBtn.addEventListener('click', checkForUpdates);

    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetCalc);

    const fldSettingsBtn = document.getElementById('fldSettings');
    if (fldSettingsBtn) {
        fldSettingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('Settings1').style.display = 'none';
            document.getElementById('Settings3').style.display = 'grid';
            document.getElementById('ovBtnSettings').style.display = 'none';
            document.getElementById('closeSettingsModalButton').style.display = 'none';
            document.getElementById('mh1').style.display = 'none';
            document.getElementById('mh2').style.display = 'none';
            document.getElementById('calcBottomOffset').click();
            // settingsModal.style.opacity = '0.8';
            /// setTimeout(calcResize, 200);
        });
    }

    // --- Слушатели за бутоните за управление на подсказките ---
    const resetTipsButton = document.getElementById('resetTipsButton');
    if (resetTipsButton) {
        resetTipsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            settingsModal.style.display = 'none';
            updateRestoInputState(false);
            modalIsActive = false;
            resetLayoutSettingsView();
            if (typeof showTips === 'function') {
                tutorialSkinSwitch = true;
                memoryShow(4, showTips); // Switch skin, then start tutorial
            }
        });
    }

    historyList.addEventListener('click', (event) => {
        event.stopPropagation();
        event.preventDefault();
        const li = event.target.closest('li');
        if (!li || li.textContent === 'Няма запазена история.') return;
        // Взимаме целия текст от реда
        const text = li.textContent || "";
        // Ако има '→', взимаме само текста след нея (резултата)
        const resultText = text.includes('→') ? text.split('→')[1] : text;
        let levValueStr = '';
        let eurValueStr = '';
        // Разделяме резултата по знака '='
        if (resultText.includes('=')) {
            const parts = resultText.split('=');
            // "Почистваме" всяка част от всичко, което не е цифра, запетая или минус
            const regex = /[^-0-9,]/g;
            levValueStr = parts[0].replace(regex, '');
            eurValueStr = parts[1].replace(regex, '');
        } else {
            // Ако няма '=', приемаме, че целият низ е една стойност
            const regex = /[^-0-9,]/g;
            const singleValue = resultText.replace(regex, '');
            levValueStr = singleValue;
            // За да работи коректно, трябва да изчислим другата валута
            const numValue = parseNumber(singleValue);
            if (!isNaN(numValue)) {
                if (levMode) { // Предполагаме, че единичната стойност е в активната валута
                    eurValueStr = formatNumber(numValue / EXCHANGE_RATE);
                } else {
                    eurValueStr = formatNumber(numValue); // eur е вече зададено
                    levValueStr = formatNumber(numValue * EXCHANGE_RATE);
                }
            } else {
                eurValueStr = singleValue;
            }
        }
        // Избираме коя стойност да заредим според активния дисплей
        const valueToLoad = levMode ? levValueStr : eurValueStr;
        if (valueToLoad) {
            userInput = valueToLoad.replace(/\\s/g, '');
            updateDisplays(userInput, userInput, 'L');
            historyModal.style.display = 'none';
            updateRestoInputState(false);
            modalIsActive = false;
        }
    })

    loadHistory();
    // calcResize ();
    // Initial font size adjustment for both fields based on their (potentially empty) content
    adjustFontSize(levInput, eurInput);

});

function calcResize() {
    getImageVisualSize();
    scaleMainPoints(aspectRatioW, aspectRatioH);
    const layout = calcNewCoordinates();
    keys = layout.keys;
    displayCoords = layout.displayCoords;
    adjustFontSize(levInput, eurInput)
};

// Следене на преоразмеряването на прозореца
window.addEventListener("resize", function () {
    calcResize()
});

function resetLayoutSettingsView() {
    document.getElementById('Settings1').style.display = 'grid';
    document.getElementById('Settings2').style.display = 'none';
    document.getElementById('Settings3').style.display = 'none'; // Добавено: скрива и тази секция
    // Добавено: Показваме отново скритите бутони
    document.getElementById('ovBtnSettings').style.display = 'flex';
    document.getElementById('closeSettingsModalButton').style.display = 'flex';
    layoutSettingsVisible = false;
    document.getElementById('mh1').style.display = 'flex';
    document.getElementById('mh2').style.display = 'flex';
    settingsModal.style.opacity = '1.0';

}

function toggleLayoutSettingsView() {
    if (!layoutSettingsVisible) {
        // Превключваме към изглед с настройките за зоните
        document.getElementById('Settings1').style.display = 'none';
        document.getElementById('Settings2').style.display = 'grid';
        document.getElementById('settingsModal').style.opacity = '1.0';
        document.getElementById('closeSettingsModalButton').hidden = false;
        layoutSettingsVisible = true;
    } else {
        // Затваряме модала и показваме зоните върху калкулатора
        showOv(); // Тази функция вече затваря модала
        setTimeout(() => { resetLayoutSettingsView(); ovFlag = true; showOv(); }, 5000);// Връщаме изгледа в начално състояние за следващия път
        //setTimeout(() => document.getElementById('saveSettings').click(), 5000);
    }
}

function showOv() {
    if (!ovFlag) {
        const layout = calcNewCoordinates();
        displayCoords = layout.displayCoords;
        placeKeys(keys, displayCoords); ovFlag = true;
    } else {
        noOverlay();
        ovFlag = false;
    }
    settingsModal.style.display = 'none';
    updateRestoInputState(false);
    setTimeout(() => {
        modalIsActive = false;
    }, 0);
    //e.stopPropagation();
    //e.preventDefault();
}

if (closeHelpModalButton) {
    closeHelpModalButton.addEventListener('click', closeHelpModal);
}

if (closeHelpModalButtonTop) {
    closeHelpModalButtonTop.addEventListener('click', closeHelpModal);
}

function closeHelpModal(e) {
    helpModal.style.display = 'none';
    updateRestoInputState(false);
    setTimeout(() => {
        modalIsActive = false;
    }, 0);
    e.stopPropagation();
    e.preventDefault();
}

// Деактивирай по време на разработка, за да не кешира и се зарежда винаги
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sww.js')
        .then(reg => {
            console.log('Service Worker регистриран:', reg);
            navigator.serviceWorker.addEventListener('message', event => {
                if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
                    const currentVersion = localStorage.getItem('CXCalc_appVersion');
                    const newVersion = event.data.version;

                    if (newVersion && newVersion !== currentVersion) {
                        console.log('Налична е нова версия:', newVersion);
                        localStorage.setItem('CXCalc_appVersion', newVersion);

                        // Only show notification and reload if it's an actual update, not the first install
                        if (currentVersion) {
                            showNotification('Налична е нова версия. Презареждане...', 'success', 4000, true);
                        }
                    }
                }
            });
        })
        .catch(err => {
            console.error('Грешка при регистрация на Service Worker:', err);
        });
}

let deferredPrompt;

function setupDismissablePrompt(promptElement, dismissButton, declineButton, countdownSeconds = 20) { // countdownSpan, 
    promptElement.style.display = 'flex';
    let countdown = countdownSeconds;
    // if (countdownSpan) {
    //    countdownSpan.textContent = ` (${countdown})`;
    // }

    let interval;
    let installHandler; // Declare installHandler here to make it accessible in cleanup

    const cleanup = () => {
        clearInterval(interval);
        promptElement.style.display = 'none';
        dismissButton.removeEventListener('click', dismissHandler);
        if (declineButton) {
            declineButton.removeEventListener('click', declineHandler);
        }
        // Special handling for the main install prompt
        if (promptElement.id === 'install-bar') {
            const installButton = document.getElementById('install');
            installButton.removeEventListener('click', installHandler);
        }
    };

    const dismissHandler = () => {
        cleanup();
    };

    const declineHandler = () => {
        localStorage.setItem('CXCalc_pwaInstallDeclined', 'true');
        cleanup();
    };

    // This handler is specific to the 'beforeinstallprompt' event
    installHandler = () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then(() => {
                deferredPrompt = null;
            });
        }
        cleanup();
    };

    dismissButton.addEventListener('click', dismissHandler, { once: true });
    if (declineButton) {
        declineButton.addEventListener('click', declineHandler, { once: true });
    }

    // Special handling for the main install prompt
    if (promptElement.id === 'install-bar') {
        const installButton = document.getElementById('install');
        installButton.addEventListener('click', installHandler, { once: true });
    }
    interval = setInterval(() => {
        countdown--;
        //if (countdownSpan) {
        //     countdownSpan.textContent = ` (${String(countdown).padStart(2, '0')})`;
        // }
        if (countdown <= 0) {
            cleanup();
        }
    }, 1000);
}

if (localStorage.getItem('CXCalc_pwaInstallDeclined') !== 'true') {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBar = document.getElementById('install-bar');
        const installButton = document.getElementById('install');
        const dismissButton = document.getElementById('dismiss-install'); // New ID
        const declineButton = document.getElementById('decline-install'); // New ID
        // const countdownSpan = document.getElementById('install-countdown');

        installPromptWasShown = true; // Set flag
        setupDismissablePrompt(installBar, dismissButton, declineButton); // Correct parameters --> , countdownSpan
    });
}

function showNotification(message, type = 'info', duration = 3000, isReloading = false) {
    const existingNotice = document.querySelector('.custom-notification');
    if (existingNotice) {
        document.body.removeChild(existingNotice);
    }

    const notice = document.createElement('div');
    notice.className = 'custom-notification';
    notice.textContent = message;

    const colors = {
        info: '#0078d4',    // Синьо
        success: '#107c10', // Зелено
        error: '#d13438'    // Червено
    };
    notice.style.background = colors[type] || colors.info;

    Object.assign(notice.style, {
        position: 'fixed',
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '6px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        zIndex: '9999',
        fontFamily: 'sans-serif',
        opacity: '0',
        transition: 'opacity 0.5s ease-in-out',
        width: '80%',
        maxWidth: '300px',
        textAlign: 'center'
    });
    document.body.appendChild(notice);

    setTimeout(() => { notice.style.opacity = '1'; }, 10);

    setTimeout(() => {
        notice.style.opacity = '0';
        setTimeout(() => {
            if (isReloading) {
                window.location.reload();
            } else if (document.body.contains(notice)) {
                document.body.removeChild(notice);
            }
        }, 500);
    }, duration);
}

// Function to get file size from server using HEAD request
async function getFileSizeFromServer(url) {
    try {
        const response = await fetch(url, { method: 'HEAD', cache: 'no-store' }); // no-store to ensure fresh data
        if (response.ok) {
            const contentLength = response.headers.get('Content-Length');
            return contentLength ? parseInt(contentLength, 10) : null;
        }
    } catch (error) {
        console.error(`Error fetching size for ${url}:`, error);
    }
    return null;
}

// Function to store current file sizes in localStorage
async function storeCurrentFileSizes() {
    if (localStorage.getItem('CXCalc_fileSizes')) {
        console.log('File sizes already stored. Skipping initialization.');
        return;
    }
    const currentSizes = {};
    for (const file of filesToCheck) {
        // Fetch the file itself to get its size from the *currently loaded* version
        // This is a workaround as direct access to cached file size is not trivial
        // This will fetch from cache if available, otherwise from network
        try {
            const response = await fetch(file, { cache: 'no-store' });
            if (response.ok) {
                const blob = await response.blob();
                currentSizes[file] = blob.size;
            } else {
                console.warn(`Could not get size for ${file}: ${response.status}`);
                currentSizes[file] = null;
            }
        } catch (error) {
            console.error(`Error getting current size for ${file}:`, error);
            currentSizes[file] = null;
        }
    }
    localStorage.setItem('CXCalc_fileSizes', JSON.stringify(currentSizes));
    console.log('Stored current file sizes:', currentSizes);
}

function checkForUpdates() {
    const checkVersionBtn = document.getElementById('checkVersionBtn');
    if (!navigator.onLine) {
        showNotification('Няма връзка с интернет. Проверката е невъзможна.', 'error');
        return;
    }
    if (!('serviceWorker' in navigator)) {
        showNotification('Service Worker не се поддържа.', 'error');
        return;
    }
    const btnTextSpan = checkVersionBtn.querySelector('span');
    const originalText = btnTextSpan ? btnTextSpan.textContent : 'Провери за версия';
    if (btnTextSpan) btnTextSpan.textContent = 'Проверява се...';
    checkVersionBtn.disabled = true;
    navigator.serviceWorker.getRegistration().then(async registration => {
        if (!registration) {
            showNotification('Service Worker не е регистриран.', 'error');
            resetButtonState();
            return;
        }
        let updateNeeded = false;
        const storedSizes = JSON.parse(localStorage.getItem('CXCalc_fileSizes')) || {};
        const serverSizes = {};
        for (const file of filesToCheck) {
            const serverSize = await getFileSizeFromServer(file);
            serverSizes[file] = serverSize;
            console.log(`File: ${file}, Stored Size: ${storedSizes[file]}, Server Size: ${serverSize}`);
            if (serverSize !== null && storedSizes[file] !== serverSize) {
                console.log(`Размерът на ${file} се различава. Нужен е ъпдейт.`);
                updateNeeded = true;
                // break; // We will continue checking all files to store all new sizes
            }
        }
        if (updateNeeded) {
            console.log('Налична е нова версия въз основа на разлики в размера на файловете.');
            // Save the new sizes right away
            localStorage.setItem('CXCalc_fileSizes', JSON.stringify(serverSizes));
            console.log('Updated stored file sizes:', serverSizes);

            registration.update().then(() => {
                if (registration.installing) {
                    console.log('SW: Намерен е нов service worker, инсталира се...');
                    showNotification('Инсталира се нова версия. Презареждане...', 'info', 4000, true);
                } else if (registration.waiting) {
                    console.log('SW: Намерен е чакащ service worker. Изпраща се команда за активиране...');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    showNotification('Активира се нова версия. Презареждане...', 'info', 4000, true);
                } else {
                    console.log('SW update triggered, but no new/waiting SW found. Forcing cache update.');
                    if (navigator.serviceWorker.controller) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'CLEAR_CACHE_AND_UPDATE',
                            files: filesToCheck
                        });
                        // Reload the page to apply the new cache
                        showNotification('Обновяване на кеша. Презареждане...', 'info', 4000, true);
                    } else {
                        showNotification('Service Worker не е активен. Моля, презаредете.', 'error');
                        resetButtonState();
                    }
                }
            }).catch(error => {
                console.error('Грешка при стартиране на SW update:', error);
                showNotification('Грешка при инсталиране на нова версия.', 'error');
                resetButtonState();
            });
        } else {
            console.log('Вие използвате последната версия (размерите на файловете съвпадат).');
            showNotification('Вие използвате последната версия.', 'success');
            resetButtonState();
        }
    }).catch(error => {
        console.error('Грешка при проверка за нова версия:', error);
        showNotification('Грешка при проверката за нова версия.', 'error');
        resetButtonState();
    });

    function resetButtonState() {
        setTimeout(() => {
            if (btnTextSpan) btnTextSpan.textContent = originalText;
            checkVersionBtn.disabled = false;
        }, 3000);
    }
}

// ------------ status.js

/* updateMemoryStatusDisplay: Променя цвета на фона на статус зоната
* Приема:
*   - slot: Номер на слота на паметта (1, 2, 3).
*   - hasValue: Булева стойност (true, ако има стойност; false, ако е изчистена). */
function updateMemoryStatusDisplay(slot, hasValue) {
    const statusElement = document.getElementById(`statusArea${slot}`);
    if (statusElement) {
        statusElement.style.backgroundColor = hasValue ? "rgb(225, 250, 4)" : "#565749"; // алтернативен или оригинален цвят
    }
}

// Проверка дали клавишът има допълнително поведение
function isMemoryKey(value) {
    return /^[1-9]$/.test(value) || ["*", "/", "-"].includes(value);
}

function memoryAdd(targetSlot, operation = "+") {
    const rawText = (levMode ? displaylv : display).textContent.trim();
    const cleanText = rawText.replace(/\s/g, '').replace(',', '.');
    let value = parseFloat(cleanText);
    if (isNaN(value)) value = 0;
    if (Mem[targetSlot] === undefined) Mem[targetSlot] = 0;
    switch (operation) {
        case "+":
            Mem[targetSlot] += value;
            console.log(`M+ в Mem[${targetSlot}] → +${value} = [${Mem}]`);
            updateMemoryStatusDisplay(targetSlot, true); // Променя фона на светлосин
            setTimeout(() => {
                updateMemoryStatusDisplay(targetSlot, false); // Връща оригиналния фон след х секунди
            }, 300);
            break;
        case "-":
            Mem[targetSlot] -= value;
            console.log(`M− в Mem[${targetSlot}] → −${value} = [${Mem}]`);
            updateMemoryStatusDisplay(targetSlot, true); // Променя фона на светлосин
            setTimeout(() => {
                updateMemoryStatusDisplay(targetSlot, false); // Връща оригиналния фон след х секунди
            }, 300);
            break;
        case "0":
            Mem[targetSlot] = 0;
            console.log(`0 в Mem[${targetSlot}] → +${value} = [${Mem}]`);
            break;
        default:
            console.warn("❗ Непозната операция:", operation);
    }
    localStorage.setItem('CXCalc_CalcMem', JSON.stringify(Mem));
    const statusId = typeof targetSlot === "number" ? `statusArea${targetSlot}` : targetSlot;
    const status = document.getElementById(statusId);
    if (!status) {
        //console.warn(`updateStatus: елемент с id '${statusId}' не е намерен.`);
        return;
    }
    //console.log(`✔️ updateStatus(${statusId}):`, message);
    status.textContent = "M" + targetSlot;
    status.style.opacity = "1";
}

// Действията за памет
function executeMemoryAction(value, statusArea) {
    switch (statusArea) {
        case 1:
            switch (value) {
                case "1": memoryAdd(1, "+"); break;
                case "4": memoryAdd(1, "-"); break;
                case "7": memoryAdd(1, "0"); clearStatus(statusArea); break;
            }
            break;
        case 2:
            switch (value) {
                case "2": memoryAdd(2, "+"); break;
                case "5": memoryAdd(2, "-"); break;
                case "8": memoryAdd(2, "0"); clearStatus(statusArea); break;
            }
            break;
        case 3:
            switch (value) {
                case "3": memoryAdd(3, "+"); break;
                case "6": memoryAdd(3, "-"); break;
                case "9": memoryAdd(3, "0"); clearStatus(statusArea); break;
            }
            break;
    }
}

function tempShow(Str, len = 1) {
    const originalValue = displaylv.textContent; // Запазваме оригиналната стойност на levInput
    const originalEurValue = display.textContent; // Запазваме оригиналната стойност на eurInput (div)
    const originalBgColor = displaylv.style.backgroundColor;
    const originalEurBgColor = display.style.backgroundColor; // Запазваме оригиналния фон на eurInput (div)
    // Показваме стойността в eurInput (div)
    display.textContent = Str;
    adjustFontSize(displaylv, display);
    display.style.backgroundColor = 'rgba(255, 223, 186, 0.5)'; // Светло оранжево за индикация
    // Връщаме оригиналните стойности след 1 секундa
    setTimeout(() => {
        display.textContent = originalEurValue;
        display.style.backgroundColor = originalEurBgColor;
        adjustFontSize(displaylv, display); // <--- ADD THIS LINE
    }, len * 1000);
}

//memoryShow: Временно показва стойността от даден слот на паметта в горния дисплей, без да го променя
function memoryShow(slot, callback) { // Добавен е 'callback'
    if (slot == 4) {
        const calculatorEl = document.getElementById("calculator");
        let baseSkin, altSkin;

        if (standardKeyboard) {
            baseSkin = "CalculatorS.png";
            altSkin = "CalculatorAS.png";
        } else {
            baseSkin = "Calculator0.png";
            altSkin = "CalculatorA.png";
            if (handMode === 'left') {
                baseSkin = "Calculator0L.png";
                altSkin = "CalculatorAL.png";
            }
        }

        const newSkin = calculatorEl.src.includes(altSkin) ? baseSkin : altSkin;
        // Запазваме оригиналния onload, за да го възстановим
        if (!originalOnloadHandler) {
            originalOnloadHandler = calculatorEl.onload;
        }
        // Временно деактивираме подсказките, за да не се покаже tip при смяната
        const originalTipsEnabled = tipsEnabled;
        tipsEnabled = false;
        calculatorEl.onload = () => {
            // Изпълняваме оригиналната функция за преизчисляване на layout
            if (typeof originalOnloadHandler === 'function') {
                originalOnloadHandler();
            }
            // Възстановяваме флага за подсказките
            tipsEnabled = originalTipsEnabled;
            // Ако има callback (т.е. стартираме обучение), го изпълняваме
            if (typeof callback === 'function') {
                callback();
            }
            // Връщаме оригиналния onload handler
            calculatorEl.onload = originalOnloadHandler;
        };
        calculatorEl.src = newSkin;
        // Only save the skin if it's NOT part of the tutorial skin switch
        if (!tutorialSkinSwitch) {
            const settings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || defaultSettings;
            settings.calculatorSkin = newSkin.endsWith('L.png') ? newSkin.replace('L.png', '.png') : newSkin;
            localStorage.setItem('CXCalc_appSettings', JSON.stringify(settings));
        }
        return;
    }
    if (Mem[slot] === undefined) {
        console.warn(`Памет Mem[${slot}] е недефинирана.`);
        return;
    }
    // Форматираме и показваме стойността от паметта
    const memValueStr = groupByThree(formatNumber(Mem[slot]));
    tempShow(memValueStr);
}

function memoryRecall(slot) {
    // Guard clause: не променяме, ако паметта е празна или ако потребителят вече е въвел число
    if (Mem[slot] === undefined || Mem[slot] === 0 || (userInput !== "" && !(/[+\-*/×÷]$/.test(userInput)))) {
        return;
    }
    const valueStr = Mem[slot].toString().replace('.', ',');
    userInput += valueStr; // Добавяме стойността от паметта към текущия вход
    const isExpression = /[+\-*/×÷(]/.test(userInput);
    // Определяме кой дисплей е първичен и кой вторичен, за да избегнем повторение на код
    const primaryDisplay = levMode ? displaylv : display;
    const secondaryDisplay = levMode ? display : displaylv;
    const conversionFunction = levMode ? convertFromLevToEur : convertFromEurToLev;
    if (isExpression) {
        // Ако е израз, показваме го в първичния дисплей и изчистваме вторичния
        primaryDisplay.textContent = userInput.replace(/\*/g, "×").replace(/\//g, "÷");
        secondaryDisplay.textContent = "";
    } else {
        // Ако е число, форматираме го и показваме конвертираната стойност
        primaryDisplay.textContent = groupByThree(userInput, true);
        secondaryDisplay.textContent = groupByThree(conversionFunction(userInput, true));
    }
    console.log(`📟 MR от Mem[${slot}] → "${valueStr}" → нов userInput: "${userInput}"`);
    adjustFontSize(displaylv, display);
    updateMemoryStatusDisplay(slot, false); // Връща оригиналния фон веднага при извикване
}

function clearStatus(sArea) {
    const statusId = typeof sArea === "number" ? `statusArea${sArea}` : sArea;
    const status = document.getElementById(statusId);
    if (!status) return;
    status.style.opacity = "0";
}

// calc.js ----------------------

function scaleMainPoints(aspectRatioW, aspectRatioH) {
    if (!MainPointsO) return;
    for (const key in MainPointsO) {
        const originalPoint = MainPointsO[key];
        if (
            originalPoint &&
            typeof originalPoint.x === "number" &&
            typeof originalPoint.y === "number"
        ) {
            MainPoints[key] = {
                x: originalPoint.x * aspectRatioW,
                y: originalPoint.y * aspectRatioH
            };
            // console.log(`MainPoints[${key}]: x=${MainPoints[key].x}, y=${MainPoints[key].y}`);
            // console.log(`MainPointsO[${key}]: x=${MainPointsO[key].x}, y=${MainPointsO[key].y}`);
        }
    }
}

function positionStatusArea(index, ovFlag = false) {
    const col = index - 1;
    const rect = calculator.getBoundingClientRect();
    const keyX = MainPoints.Keys.x + col * (MainPoints.KeySize.x + MainPoints.KbdGaps.x);
    const keyCenter = keyX + MainPoints.KeySize.x / 2;
    const status = document.getElementById(`statusArea${index}`);
    if (status && !ovFlag) {
        // status.className = "statusArea";
        // status.style.position = "fixed";
        status.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
        status.style.top = `${rect.top + MainPoints.Status.y}px`;
        status.style.width = `${MainPoints.StatusSize.x}px`;
        status.style.height = `${MainPoints.StatusSize.y}px`;
        // status.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
    }
    if (ovFlag) {
        const container = document.body;
        // Изчистване на предишните маркери
        const marker = document.createElement("div");
        marker.className = "overlay-marker";
        marker.style.position = "fixed";
        marker.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
        marker.style.top = `${rect.top + MainPoints.Status.y}px`;
        marker.style.width = `${2 + MainPoints.StatusSize.x}px`;
        marker.style.height = `${2 + MainPoints.StatusSize.y}px`;
        marker.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
        marker.style.backgroundColor = "transparent"; //"rgba(255,255,255,0.5)";
        marker.style.border = "5px solid yellow";
        marker.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
        marker.style.zIndex = "9999";
        container.appendChild(marker);
    }
}

function noOverlay() {
    document.querySelectorAll('.overlay-marker').forEach(e => e.remove());
};

function placeKeys(keys, displayCoords) {
    const container = document.body;
    // Изчистване на предишните маркери
    noOverlay();
    // Клавиши 
    keys.forEach(key => {
        const keyElement = document.createElement("div");
        keyElement.className = "overlay-marker";
        keyElement.style.position = "fixed";
        keyElement.style.left = `${key.x}px`;
        keyElement.style.top = `${key.y}px`;
        keyElement.style.width = `${MainPoints.KeySize.x}px`;
        keyElement.style.height = `${MainPoints.KeySize.y}px`;
        keyElement.style.backgroundColor = "transparent"; //"rgba(255,255,255,0.5)";
        keyElement.style.border = "1px solid yellow";
        keyElement.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
        keyElement.style.zIndex = "9999";
        container.appendChild(keyElement);
    });
    // Позициониране на статус областите
    for (let i = 1; i < 5; i++) positionStatusArea(i, true);
}

function calcNewCoordinates() {
    if (!calculator) {
        console.error("Липсва изображението на калкулатора.");
        return { keys: [], displayCoords: {} };
    }
    const rect = calculator.getBoundingClientRect();
    const containerRect = document.getElementById('calculatorContainer').getBoundingClientRect();
    // console.log("Координати на калкулатора L T:", rect.left, rect.top, MainPoints.Display.y);
    // Връщаме координати за оверлея
    // Връщаме координати за оверлея
    const offX = window.imgOffsetX || 0;
    const offY = window.imgOffsetY || 0;

    const displayCoords = {
        lv: {
            x: rect.left + offX + MainPoints.Displaylv.x,
            y: rect.top + offY + MainPoints.Displaylv.y
        },
        eur: {
            x: rect.left + offX + MainPoints.Display.x,
            y: rect.top + offY + MainPoints.Display.y
        }
    };
    // в  масива за клавишите - новите координати
    const keys = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            keys.push({
                x: rect.left + offX + MainPoints.Keys.x + col * (MainPoints.KeySize.x + MainPoints.KbdGaps.x),
                y: rect.top + offY + MainPoints.Keys.y + row * (MainPoints.KeySize.y + MainPoints.KbdGaps.y),
                value: getKeyValue(row, col)
            });
        }
    }
    const markers = [
        { label: "Долен дисплей", id: "levInput", coords: displayCoords.lv },
        { label: "Горен дисплей", id: "eurInput", coords: displayCoords.eur },
        { label: "Валута", id: "currency", coords: { x: displayCoords.eur.x + MainPoints.CurrencyOffset.x, y: displayCoords.eur.y + MainPoints.CurrencyOffset.y } },
        { label: "Валута Лев", id: "currencyLev", coords: { x: displayCoords.lv.x + MainPoints.CurrencyLevOffset.x, y: displayCoords.lv.y + MainPoints.CurrencyLevOffset.y } }
    ];
    if (MainPoints.Resto) {
        markers.push({
            label: "Resto Panel",
            id: "restoImage",
            coords: { x: Math.round(rect.left + offX + MainPoints.Resto.x), y: Math.round(rect.top + offY + MainPoints.Resto.y) },
            size: MainPoints.RestoSize ? { x: Math.round(MainPoints.RestoSize.x), y: Math.round(MainPoints.RestoSize.y) } : null
        });
    }
    markers.forEach(({ label, id, coords, size }) => {
        // console.log("Дисплей на калкулатора.");
        const x = parseFloat(coords?.x);
        const y = parseFloat(coords?.y);
        if (isNaN(x) || isNaN(y)) {
            console.warn(`⚠️ ${label} получи невалидни координати:`, coords);
            return;
        }
        const marker = document.getElementById(id);
        if (!marker) {
            console.warn(`⚠️ Елемент с id '${id}' не е намерен.`);
            return;
        }

        marker.title = label;
        marker.style.position = "absolute";
        marker.style.left = `${x - containerRect.left}px`;
        marker.style.top = `${y - containerRect.top}px`;
        if (id === "levInput" || id === "eurInput") {
            // Запазваме текущото състояние на 'active-display', преди да променим класовете.
            const isActive = marker.classList.contains('active-display');
            // Задаваме основния клас, което премахва 'active-display'.
            marker.className = "calculator-display";
            // Ако елементът е бил активен, добавяме класа отново.
            if (isActive) {
                marker.classList.add('active-display');
            }
            marker.style.width = `${MainPoints.DisplaySize.x}px`;
            marker.style.height = `${MainPoints.DisplaySize.y}px`;
        } else if (id === "currency" || id === "currencyLev") {
            const baseFontSize = 24; // Базов размер на шрифта
            marker.style.fontSize = `${baseFontSize * aspectRatioH}px`;
        } else if (size) {
            marker.style.width = `${size.x}px`;
            marker.style.height = `${size.y}px`;
        }
    });
    // Position Resto Fields
    if (MainPoints.Fields && MainPoints.FieldsSize && MainPoints.FldGaps) {
        const fieldIds = [
            ['due1', 'due2'],
            ['paid1', 'paid2'],
            ['resto1', 'resto2']
        ];

        for (let r = 0; r < fieldIds.length; r++) {
            for (let c = 0; c < fieldIds[r].length; c++) {
                const fId = fieldIds[r][c];
                const inputEl = document.getElementById(fId);
                if (inputEl) {
                    const fx = rect.left + offX + MainPoints.Fields.x + c * (MainPoints.FieldsSize.x + MainPoints.FldGaps.x);
                    const fy = rect.top + offY + MainPoints.Fields.y + r * (MainPoints.FieldsSize.y + MainPoints.FldGaps.y);

                    const wrapper = inputEl.closest('.input-wrapper');
                    const target = wrapper || inputEl;

                    target.style.position = 'absolute';
                    target.style.left = `${Math.round(fx - containerRect.left)}px`;
                    target.style.top = `${Math.round(fy - containerRect.top)}px`;
                    target.style.width = `${Math.round(MainPoints.FieldsSize.x)}px`;
                    target.style.height = `${Math.round(MainPoints.FieldsSize.y)}px`;

                    if (wrapper) {
                        // Reset input inline styles if wrapper is handling position
                        inputEl.style.position = 'relative'; // relative allows 100% logic
                        inputEl.style.left = '0';
                        inputEl.style.top = '0';
                        inputEl.style.width = '100%';
                        inputEl.style.height = '100%';
                    }
                }
            }
        }
    }

    for (let i = 1; i < 5; i++) positionStatusArea(i); // already there
    return { keys, displayCoords };
}

// history.js -----------------------

let history = []; // масив от { entry: string, session: number }

function loadHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('CXCalc_history'));
    // Филтрираме старите записи, които може да нямат 'operation' или 'result'
    history = savedHistory ? savedHistory.filter(record => record.operation && record.result) : [];
}

function saveHistoryToStorage() {
    localStorage.setItem('CXCalc_history', JSON.stringify(history));
}

function addHistoryEntry(operation, levValue, eurValue) {
    const formattedLev = groupByThree(formatNumber(levValue));
    const formattedEur = groupByThree(formatNumber(eurValue));
    let entry = `${formattedLev} ${CURRENCY_LEV_SYMBOL} = ${formattedEur}${CURRENCY_SYMBOL}`; // @@
    if (`${groupByThree(formatNumber(levValue))}` == "" || `${groupByThree(formatNumber(eurValue))}` == "") {
        if (formattedLev === "") {
            entry = `${formattedEur}`;
        } else if (formattedEur === "") {
            entry = `${formattedLev}`;
        }
    };
    history.unshift({ operation, result: entry });
    if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    saveHistoryToStorage();
}

function formatExpression(expression) {
    expression = expression.replace(/\s+/g, '');
    const regex = /(\d+(?:[,.]\d+)?)([+\-*/×÷])(\d+(?:[,.]\d+)?)/;
    return expression.replace(regex, (_, raw1, operator, raw2) => {
        const num1 = groupByThree(raw1, false);
        const num2 = groupByThree(raw2, false);
        return `${num1} ${operator} ${num2}`;
    });
}

function updateHistoryList() {
    historyList.innerHTML = '';
    if (history.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Няма запазена история.';
        historyList.appendChild(li);
        return;
    }

    history.forEach(record => {
        const li = document.createElement('li');
        li.style.cursor = 'pointer';

        let fullText = '';
        if (/[+\-*/×÷]/.test(record.operation)) {
            fullText = `${formatExpression(record.operation)} &rarr; ${record.result}`;
        } else {
            const operationNumber = parseFloat(record.operation.replace(',', '.'));
            const resultNumberRaw = record.result.split('=')[0].replace(/\s/g, '').replace(CURRENCY_LEV_SYMBOL, '').replace(',', '.');
            const resultNumber = parseFloat(resultNumberRaw);

            if (Math.abs(operationNumber - resultNumber) > 0.001 && !isNaN(operationNumber)) {
                fullText = `${groupByThree(record.operation, false)} &rarr; ${record.result}`;
            } else {
                fullText = record.result;
            }
        }
        li.innerHTML = fullText;

        // Store values in data attributes for robust retrieval
        if (record.result.includes(CURRENCY_LEV_SYMBOL) && record.result.includes(CURRENCY_SYMBOL)) {
            const parts = record.result.split('=');
            li.dataset.lev = parts[0].replace(CURRENCY_LEV_SYMBOL, '').trim();
            li.dataset.eur = parts[1].replace(CURRENCY_SYMBOL, '').trim();
        } else {
            const symbolsToRemove = new RegExp([CURRENCY_LEV_SYMBOL, CURRENCY_SYMBOL].join('|'), 'g');
            const singleValue = record.result.replace(symbolsToRemove, '').trim();
            li.dataset.lev = singleValue;
            li.dataset.eur = singleValue;
        }

        historyList.appendChild(li);
    });
}

function handleClearHistory() {
    history = [];
    saveHistoryToStorage();
    updateHistoryList();
    closeHistoryModalButton.click();
}

function historyOpen() {
    noOverlay();
    updateHistoryList();
    historyModal.style.display = 'flex';
    modalIsActive = true;
    updateRestoInputState(true);
};

// Clear History button
if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', handleClearHistory);
}

if (closeHistoryModalButton) {
    closeHistoryModalButton.addEventListener('click', (e) => {
        historyModal.style.display = 'none';
        updateRestoInputState(false);
        // Забавяне на изключването с 1 tick (0 ms timeout)
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    });
}

// fontcalc.js ------------------------

function getTextWidth(text, inputElement) {
    const span = document.createElement("span");
    span.style.visibility = "hidden";
    span.style.position = "absolute";
    span.style.whiteSpace = "pre"; // запазва интервалите
    span.style.fontSize = getComputedStyle(inputElement).fontSize;
    span.style.fontFamily = getComputedStyle(inputElement).fontFamily;
    span.style.fontWeight = getComputedStyle(inputElement).fontWeight;
    span.textContent = text;
    document.body.appendChild(span);
    const width = span.offsetWidth;
    document.body.removeChild(span);
    return width;
}

function adjustFontSize(element1, element2) {
    const maxFontSize = 48;
    const minFontSize = 14;
    // Вземаме текстовете
    const text1 = element1.innerText !== undefined ? element1.innerText : element1.textContent || "0";
    const text2 = element2.innerText !== undefined ? element2.innerText : element2.textContent || "0";
    console.log("text1: " + text1);
    console.log("text2: " + text2);
    // Използваме ширината и височината на по-малкия елемент (за по-сигурно)
    // Използваме getBoundingClientRect() за по-голяма точност (връща дробни стойности)
    const rect1 = element1.getBoundingClientRect();
    const rect2 = element2.getBoundingClientRect();
    const width = Math.min(rect1.width, rect2.width);
    const height = Math.min(rect1.height, rect2.height);
    // Създаваме скрит div за измерване
    const measuringDiv = document.createElement("div");
    measuringDiv.style.position = "absolute";
    measuringDiv.style.visibility = "hidden";
    measuringDiv.style.height = "auto";
    measuringDiv.style.width = "auto"; // Позволяваме на елемента да се разшири свободно
    measuringDiv.style.whiteSpace = "nowrap"; // Предотвратяваме пренасянето на нов ред
    const cs = getComputedStyle(element1);
    measuringDiv.style.fontFamily = cs.fontFamily;
    measuringDiv.style.fontWeight = cs.fontWeight;
    measuringDiv.style.letterSpacing = cs.letterSpacing;
    // Без padding/border, за да мерим само съдържанието
    measuringDiv.style.padding = "0";
    measuringDiv.style.border = "none";
    measuringDiv.style.boxSizing = "border-box";
    document.body.appendChild(measuringDiv);
    // Определяме кой от двата текста е визуално по-широк, за да го използваме за измерване
    measuringDiv.style.fontSize = maxFontSize + "px"; // Измерваме с максималния шрифт
    measuringDiv.textContent = text1;
    const width1 = measuringDiv.scrollWidth;
    measuringDiv.textContent = text2;
    const width2 = measuringDiv.scrollWidth;
    const widerText = width1 >= width2 ? text1 : text2;
    let fontSize = maxFontSize;
    while (fontSize >= minFontSize) {
        measuringDiv.style.fontSize = fontSize + "px";
        measuringDiv.textContent = widerText;
        if (measuringDiv.scrollWidth <= width && measuringDiv.scrollHeight <= height) {
            break;
        }
        fontSize--;
    }
    if (fontSize < minFontSize) fontSize = minFontSize;
    // Прилагаме еднакъв размер и на двата елемента
    fontSize--;
    element1.style.fontSize = fontSize + "px";
    element2.style.fontSize = fontSize + "px";

    // Apply same font size to Resto fields (minus 5px as requested)
    const restoInputs = document.querySelectorAll('#restoInputs input');
    if (restoInputs.length > 0) {
        restoInputs.forEach(input => {
            input.style.fontSize = Math.max(10, fontSize - 12) + "px";
        });
    }

    document.body.removeChild(measuringDiv);
}

function resizeFont() {
    const height = display.clientHeight; // Взимаме височината на дисплея
    display.style.fontSize = displaylv.style.fontSize = (height * 0.99) + 'px'; // % от височината
}

// tips ------------------

/**
 * @file tips.js
 * @description Manages the interactive pop-up help system.
 */

// 1. Data structure for all available tips
const allTips = [
    {
        id: 'tip-install',
        text: 'Ако искате да инсталирате приложението, може да го направите от бутона <b>Инсталиране</b>, който се появява при първо стартиране.',
        target: 'display',
    },
    {
        id: 'tip-help',
        text: 'Показва подробна помощна информация за разширените функции на калкулатора. Задръжте го, за да се покажат помощни обозначения върху бутоните (на компютър: Ctrl+Клик).',
        target: 'statusArea4',
    },
    {
        id: 'tip-history-and-settings',
        text: 'Задръжте бутона за отваряне на <b>Настройки</b> (на компютър: Ctrl+Клик).  От <b>Настройки</b> може да определите позицията и размера на калкулатора, така че да е максимално удобен за работа. Може да зададете и предпочитания за работа със стандартна клавиатура, дясна или лява ръка.',
        target: '€', // The value of the key to attach to
    },
    {
        id: 'tip-display-switch',
        text: 'Клик върху някой от дисплеите превключва активния дисплей.',
        target: 'display', // A generic target for the display area
    },
    {
        id: 'tip-copy',
        text: 'Извлича от съдържанието на клипборда първото число (ако има такова).',
        target: '+', // A generic target for the display area
    },
    {
        id: 'tip-paste',
        text: 'Резултатът от пресмятанията се запомня автоматично в клипборда, така че може лесно да го поставите в други приложения.',
        target: 'display', // A generic target for the display area
    },
    {
        id: 'tip-video',
        text: '<a href="https://youtu.be/N_L_HIseMb4" target="_blank">Кликнете този линк и гледайте кратко видео за основните функции на калкулатора.</a>',
        target: 'display',
    },
    {
        id: 'tip-resto',
        text: 'Включва модул <b>Ресто</b>, предназначен за пресмятане на рестото при смесено плащане в лева и евро. Ако на дисплея на калкулатора има число, то се попълва автоматично в <b>Ресто</b>.<br><br><a href="https://youtu.be/LlRVxlngkGY" target="_blank">Последвайте линка за кратко представяне на модула.</a>',
        target: 'L',
    },
];

// This will hold the final tip data with show states
let tips = [];

/**
 * Finds the current coordinates of a tip's target element.
 * @param {string} target The target identifier from the tip object.
 * @returns {DOMRect | {x: number, y: number, width: number, height: number} | null}
 */
function getTargetCoordinates(target) {
    // 1. Check if the target is a calculator key from the 'keys' array
    const key = keys.find(k => k.value === target);
    if (key) {
        const keyDimensions = getKeyDimensions();
        return {
            x: key.x,
            y: key.y,
            width: keyDimensions.keyWidth,
            height: keyDimensions.keyHeight
        };
    }

    // 2. Check for special string identifiers which map to DOM elements
    let element = null;
    if (target === 'display') {
        // The 'display' tip points to the active input, but levInput is a stable choice
        element = document.getElementById('levInput');
    } else {
        // Assume the target is a direct DOM element ID
        element = document.getElementById(target);
    }

    if (element) {
        return element.getBoundingClientRect();
    }

    // 3. If no target is found, warn and return null
    console.warn(`Could not find a valid target for tip: ${target}`);
    return null;
}

/**
 * Initializes the tips system by loading saved states from localStorage.
 */
function initTips() {
    tips = allTips;
    console.log('Tips system initialized.');
}

/**
 * Creates and displays a single tip pop-up on the screen.
 * @param {object} tip The tip object to display.
 * @param {function} [onClose] Optional callback to execute when the tip is closed to show the next tip.
 */
function createTipElement(tip, onClose) {
    const targetCoords = getTargetCoordinates(tip.target);
    if (!targetCoords) {
        if (onClose) onClose(); // Continue the tutorial sequence even if a target is missing
        return;
    }

    const container = document.body;
    const tipElement = document.createElement('div');
    tipElement.className = 'tip-popup';
    tipElement.id = `popup-${tip.id}`;

    tipElement.innerHTML = `
            <div class="tip-content">${tip.text}</div>
            <div class="tip-actions">
                <button class="tip-action-btn tip-next-btn">Следващ</button>
            </div>
            <div class="tip-tail"></div>
        `;

    container.appendChild(tipElement);

    // Function to handle clicks outside the tip
    const handleOutsideClick = (event) => {
        // If the click is outside the tipElement and not on a child of tipElement
        if (!tipElement.contains(event.target) && event.target !== tipElement) {
            closeTip(event);
        }
    };

    // Add event listener to the document
    document.addEventListener('click', handleOutsideClick);

    tipElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent this click from bubbling up to document and triggering handleOutsideClick
    });

    const closeTip = (event) => {
        if (event) {
            event.stopPropagation();
        }
        if (container.contains(tipElement)) {
            container.removeChild(tipElement);
        }
        // Remove the global click listener when the tip is closed
        document.removeEventListener('click', handleOutsideClick);
        if (onClose) {
            onClose();
        }
    };

    // Position the tip dynamically based on fresh coordinates
    const targetCenterX = targetCoords.x + targetCoords.width / 2;
    const popupRect = tipElement.getBoundingClientRect();
    let top = targetCoords.y - popupRect.height - 12; // 12px for tail and gap
    let left = targetCenterX - popupRect.width / 2;

    // Boundary checks to prevent the popup from going off-screen
    if (top < 0) {
        top = targetCoords.y + targetCoords.height + 12; // Position below if not enough space above
        tipElement.classList.add('tip-below'); // Add class to flip the tail
    }
    if (left < 0) {
        left = 5; // Add some padding from the edge
    }
    if (left + popupRect.width > window.innerWidth) {
        left = window.innerWidth - popupRect.width - 5;
    }

    tipElement.style.top = `${top}px`;
    tipElement.style.left = `${left}px`;

    // Adjust tail position to point to the target\'s center
    const tail = tipElement.querySelector('.tip-tail');
    if (tail) {
        const tailWidth = 20; // As defined in CSS (border-left + border-right)
        const tailLeft = targetCenterX - left - (tailWidth / 2);
        tail.style.left = `${tailLeft}px`;
    }

    tipElement.querySelector('.tip-next-btn').addEventListener('click', (event) => {
        closeTip(event); // Continue tutorial
    });
}

/**
 * Main function to control the display of the tips tutorial.
 */
function showTips() {
    // NEW: Check if an install prompt is visible and wait for it to disappear
    const installBar = document.getElementById('install-bar');
    const iosPrompt = document.getElementById('ios-install-prompt');
    if ((installBar && installBar.style.display !== 'none') || (iosPrompt && iosPrompt.style.display !== 'none')) {
        console.log("Install prompt is visible, delaying tutorial start...");
        setTimeout(showTips, 500); // Check again in 500ms
        return;
    }

    // АКО ИМА АКТИВЕН МОДАЛЕН ПРОЗОРЕЦ, НЕ ПОКАЗВАЙ ПОДСКАЗКА
    if (modalIsActive) {
        return;
    }
    document.querySelectorAll('.tip-popup').forEach(el => el.remove());
    let tipIndex = 0;

    const endTutorial = () => {
        document.querySelectorAll('.tip-popup').forEach(el => el.remove());
        showNotification('Приятна работа с CX-Calc!', 'success');
        if (tutorialSkinSwitch) {
            memoryShow(4); // Връщаме скина, без callback
            tutorialSkinSwitch = false;
        }

        // Disable tips for subsequent runs and save
        const settings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || defaultSettings;
        settings.tipsEnabled = false;
        localStorage.setItem('CXCalc_appSettings', JSON.stringify(settings));
    }

    const showNextTip = () => {
        document.querySelectorAll('.tip-popup').forEach(el => el.remove());
        if (tipIndex < tips.length) {
            const currentTip = tips[tipIndex];
            tipIndex++;
            createTipElement(currentTip, showNextTip);
        } else {
            endTutorial();
        }
    };
    showNextTip();
}

// --- Offset Wheel Scroller Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const offsetWrappers = document.querySelectorAll('.offset-input-wrapper');
    const wheelSpinner = document.getElementById('offsetWheelSpinner');
    const arrowUp = document.querySelector('.wheel-arrow-up');
    const arrowDown = document.querySelector('.wheel-arrow-down');
    const wheelContainer = document.querySelector('.wheel-container');

    if (!wheelSpinner) return;

    let activeInputWrapper = document.querySelector('.offset-input-wrapper.active-offset');
    let activeInput = activeInputWrapper ? document.getElementById(activeInputWrapper.dataset.inputId) : null;
    let hiddenInput = activeInput ? document.getElementById(activeInput.id + '_hidden') : null;

    const numberHeight = 40; // Corresponds to .wheel-number height in CSS
    const visibleNumbers = 7; // Should be an odd number

    function populateWheel(centerValue) {
        if (!wheelSpinner) return;
        wheelSpinner.innerHTML = '';
        const fragment = document.createDocumentFragment();
        const centerIndex = Math.floor(visibleNumbers / 2);

        for (let i = 0; i < visibleNumbers; i++) {
            const offset = (i - centerIndex) * 5; // Step of 5
            const num = Math.round(centerValue / 5) * 5 + offset;
            const numberEl = document.createElement('div');
            numberEl.className = 'wheel-number';
            numberEl.textContent = num;
            if (i === centerIndex) {
                numberEl.classList.add('active');
            }
            fragment.appendChild(numberEl);
        }
        wheelSpinner.appendChild(fragment);

        wheelSpinner.style.transition = 'none';
        wheelSpinner.style.transform = `translateY(-${centerIndex * numberHeight}px)`;

        void wheelSpinner.offsetHeight;

        wheelSpinner.style.transition = 'transform 0.2s ease-out';
    }

    function setActiveInput(wrapper) {
        if (activeInputWrapper) {
            activeInputWrapper.classList.remove('active-offset');
        }
        activeInputWrapper = wrapper;
        activeInputWrapper.classList.add('active-offset');
        const newId = activeInputWrapper.dataset.inputId;
        activeInput = document.getElementById(newId);
        hiddenInput = document.getElementById(newId + '_hidden');
        const currentValue = parseInt(hiddenInput.value, 10);
        populateWheel(currentValue);
    }

    function updateValue(change) {
        if (!activeInput || !hiddenInput) return;

        let currentValue = parseInt(hiddenInput.value, 10);
        const min = -500;
        const max = 500;

        let newValue = currentValue + change;
        if (newValue < min) newValue = min;
        if (newValue > max) newValue = max;

        if (newValue !== currentValue) {
            const centerIndex = Math.floor(visibleNumbers / 2);
            const initialY = -(centerIndex * numberHeight);
            const direction = change > 0 ? -1 : 1;

            wheelSpinner.style.transform = `translateY(${initialY + direction * numberHeight}px)`;

            setTimeout(() => {
                populateWheel(newValue);
                activeInput.value = newValue;
                hiddenInput.value = newValue;
                hiddenInput.dispatchEvent(new Event('input', { bubbles: true }));
            }, 200);
        }
    }

    offsetWrappers.forEach(wrapper => {
        wrapper.addEventListener('click', () => setActiveInput(wrapper));
    });

    if (arrowUp) arrowUp.addEventListener('click', () => updateValue(5));
    if (arrowDown) arrowDown.addEventListener('click', () => updateValue(-5));

    document.addEventListener('keydown', (e) => {
        if (settingsModal.style.display !== 'none' && document.getElementById('offsetWheel')) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                updateValue(5);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                updateValue(-5);
            }
        }
    });

    let touchStartY = 0;
    let touchDeltaY = 0;

    if (wheelContainer) {
        wheelContainer.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        wheelContainer.addEventListener('touchmove', (e) => {
            touchDeltaY = e.touches[0].clientY - touchStartY;
        }, { passive: true });

        wheelContainer.addEventListener('touchend', () => {
            if (Math.abs(touchDeltaY) > 20) { // Threshold
                if (touchDeltaY > 0) {
                    updateValue(-5); // Swipe down
                } else {
                    updateValue(5); // Swipe up
                }
            }
            touchDeltaY = 0; // Reset
        });
    }

    if (activeInputWrapper) {
        setActiveInput(activeInputWrapper);
    }
});

// ------------ Resto ------------------------

/* / Глобална променлива за следене на активното поле в Resto
let activeRestoField = null;

// Функция, която се вика от mainAll.js при натискане на клавиш от калкулатора
// Връща true, ако е обработила входа (т.е. има активно поле), и false иначе.
function handleCalculatorInputForResto(key) {
    // console.log("handleRestoInput called with:", key, "ActiveField:", activeRestoField);

    // Backup: ако activeRestoField е изгубен, но имаме елемент с клас active-virtual-focus, го възстановяваме.
    // Още по-добре: проверяваме document.activeElement
    if (!activeRestoField) {
        // Проверка дали document.activeElement е един от нашите inputs
        if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.closest('#restoInputs')) {
            activeRestoField = document.activeElement;
        } else {
            const virtualActive = document.querySelector('#restoInputs input.active-virtual-focus');
            if (virtualActive) {
                activeRestoField = virtualActive;
            }
        }
    }

    // Проверка за видимост на панел Resto
    const restoContainer = document.getElementById('restoInputs');
    const isRestoVisible = restoContainer && restoContainer.style.display !== 'none';

    // Ако няма активно поле и панелът НЕ е видим или ключът НЕ е 'C', излизаме
    if (!activeRestoField && !(isRestoVisible && key === 'C')) return false;

    // Игнорираме някои специални клавиши, които може да нямат смисъл тук
    // или ги обработваме специфично.

    // Ако е "C" (Clear) -> изтриваме съдържанието на ВСИЧКИ полета в панела
    if (key === 'C') {
        const inputs = document.querySelectorAll('#restoInputs input[type="text"]');
        inputs.forEach(input => {
            input.value = '';
            triggerInputEvent(input);
        });

        if (typeof window.resetRestoState === 'function') {
            window.resetRestoState();
        }

        // Фокусираме първото поле (Дължимо/Due1)
        const due1 = document.getElementById('due1');
        if (due1) {
            setTimeout(() => {
                due1.focus();
            }, 10);
        }

        // ВИНАГИ връщаме false, за да може командата 'C' да продължи към mainAll.js
        // и да изчисти дисплея на калкулатора. Така бутонът 'C' прави пълно изчистване (Global Clear).
        return false;
    }

    // Ако е "L" (Switch Display) или "€" (Settings) -> те не са за Resto, пускаме ги към mainAll
    if (key === 'L' || key === '€') {
        return false;
    }

    // Ако е "B" (Backspace) -> трием последния символ
    if (key === 'B' || key === 'Delete' || key === 'Backspace') {
        activeRestoField.value = activeRestoField.value.slice(0, -1);
        triggerInputEvent(activeRestoField);
        return true;
    }

    // Ако е цифра или запетая -> добавяме я
    // Проверка за валидни символи: 0-9, ",".  Точката я правим на запетая.
    if (/^[0-9]$/.test(key)) {
        activeRestoField.value += key;
        triggerInputEvent(activeRestoField);
        return true;
    }

    if (key === ',' || key === '.') {
        // Проверка дали вече няма запетая (във validateInput сигурно има, но за UX е добре и тук)
        if (!activeRestoField.value.includes(',')) {
            activeRestoField.value += ',';
            triggerInputEvent(activeRestoField);
        }
        return true;
    }

    return true; // Клавишът не е за нас (напр. +, -, =, L и т.н.)
}

// Помощна функция за ръчно тригиране на input event,
// за да се задействат всичките validate и calculate логики.
function triggerInputEvent(field) {
    field.dispatchEvent(new Event('input', { bubbles: true }));
}


// Закачаме focus/blur listeners, за да знаем кое е активното поле
// Note: We need to ensure DOM is ready or just execute.
const attachRestoListeners = () => {
    const inputs = document.querySelectorAll('#restoInputs input[type="text"]');
    inputs.forEach(input => {
        // Когато полето получи фокус, го правим активно
        input.addEventListener('focus', function (e) {
            // Преди да направим това поле активно, трябва да "затворим" предишното активно поле,
            // ако има такова. Това е важно при директно превключване между полетата (input1 -> input2).
            document.querySelectorAll('#restoInputs input').forEach(otherInput => {
                if (otherInput !== this && otherInput.classList.contains('active-virtual-focus')) {
                    otherInput.classList.remove('active-virtual-focus');
                    otherInput.dispatchEvent(new Event('blur')); // Форматираме предишното
                }
            });

            activeRestoField = this;

            // Опит за предотвратяване на появата на софтуерната клавиатура на мобилни устройства
            // 'readonly' hack: правим го readonly за кратко, но това спира писането.
            // inputmode='none' е по-модерният начин.
            this.setAttribute('inputmode', 'none');

            // Добавяме класа и на текущото (въпреки че по-долу имаше global logic,
            // по-добре да е тук за сигурност)
            this.classList.add('active-virtual-focus');
        });

        input.addEventListener('blur', function () {
            // Слагаме малко закъснение, за да видим дали фокусът не отива просто в друг input
            setTimeout(() => {
                if (document.activeElement !== this && !document.activeElement.closest('#restoInputs')) {
                    // console.log("Focus left Resto panel entirely.");
                    // НЕ нулираме activeRestoField веднага, за да може потребителят да клика по бутоните на калкулатора
                    // НО махаме визуалния клас
                    // this.classList.remove('active-virtual-focus'); 
                }
            }, 50);
        });
    });
};

attachRestoListeners();

// Добавяме глобален listener за кликове извън панела, за да деактивираме полето,
// АКО кликът не е върху калкулатора.
document.addEventListener('click', function (e) {
    // Проверяваме дали кликът е вътре в .calculator-container (който съдържа и панела, и калкулатора)
    const isInsideContainer = e.target.closest('.calculator-container');
    const isDisplayClick = e.target.id === 'levInput' || e.target.id === 'eurInput' || e.target.closest('.calculator-display');

    // Ако кликът е ИЗВЪН контейнера ИЛИ е дисплей, деактивираме.
    // (Това позволява кликове върху .ctoverlay, .calculator-img и самия .panel да запазват фокуса, освен ако не е дисплей)
    if ((!isInsideContainer && !e.target.classList.contains('ctoverlay') && e.target.id !== 'ctoverlay') || isDisplayClick) {
        if (activeRestoField) {
            activeRestoField.classList.remove('active-virtual-focus');
            activeRestoField.dispatchEvent(new Event('blur'));
        }

        if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.closest('#restoInputs')) {
            document.activeElement.blur();
        }

        activeRestoField = null;
        // Махаме visual active state от всички
        document.querySelectorAll('#restoInputs input').forEach(i => i.classList.remove('active-virtual-focus'));
    }
});

function updateRestoInputState(isModalOpen) {
    const restoInputs = document.getElementById('restoInputs');
    const restoImage = document.getElementById('restoImage');
    if (!restoInputs || !restoImage) return;

    if (isModalOpen) {
        restoInputs.style.display = 'none';
    } else {
        // Only show if it was supposedly active.
        // We rely on restoImage display as the source of truth for "Resto Feature Enabled"
        const isRestoActive = restoImage.style.display !== 'none' && restoImage.style.display !== '';
        if (isRestoActive) {
            restoInputs.style.display = 'block';
        }
    }
}

// Трябва да изнесем handle function глобално, за да я вика mainAll.js
window.handleRestoInput = handleCalculatorInputForResto;

window.clearRestoFocus = function () {
    if (activeRestoField) {
        activeRestoField.classList.remove('active-virtual-focus');
        activeRestoField.dispatchEvent(new Event('blur'));
    }
    if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.closest('#restoInputs')) {
        document.activeElement.blur();
    }
    activeRestoField = null;
    document.querySelectorAll('#restoInputs input').forEach(i => i.classList.remove('active-virtual-focus'));
};

// Функция за закръгляне до 2 знакa
function roundToTwo(num) {
    if (typeof num !== 'number') num = parseFloat(num);
    return parseFloat(num.toFixed(2));
}

// Функция за конвертиране EUR <-> BGN
// direction: 'eurToBgn' или 'bgnToEur'
function conveert(value, direction) {
    if (!value || value === "") return "";

    // Използваме глобалните функции от mainAll.js за еднаквост
    if (direction === 'eurToBgn') {
        // EUR -> BGN (convertFromEurToLev)
        return typeof convertFromEurToLev === 'function'
            ? convertFromEurToLev(value.toString())
            : (parseFloat(value.toString().replace(',', '.')) * (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583)).toFixed(2).replace('.', ',');
    } else {
        // BGN -> EUR (convertFromLevToEur)
        return typeof convertFromLevToEur === 'function'
            ? convertFromLevToEur(value.toString())
            : (parseFloat(value.toString().replace(',', '.')) / (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583)).toFixed(2).replace('.', ',');
    }
}

// ... [validateInput stays same, omitted for brevity if tools allows, but replace_file_content replaces block. 
// using existing validateInput is safer to include or skip if range allows. 
// I will focus on the block from line 218 to 475 to cover everything changed.]

// ... Actually I need to be careful with range. 
// I will replace `conveert` separately or includes it in the big block?
// Let's do `conveert` first.


// Функция за валидиране и филтриране на въведените символи
function validateInput(input) {
    let value = input.value;

    // Разрешени символи: цифри, +, -, точка, запетая
    let filtered = value.replace(/[^\d+\-.,]/g, '');

    // Проверка за повече от една точка или запетая
    let decimalCount = (filtered.match(/[.,]/g) || []).length;
    if (decimalCount > 1) {
        // Премахваме последната точка/запетая
        let lastDecimalIndex = Math.max(filtered.lastIndexOf('.'), filtered.lastIndexOf(','));
        filtered = filtered.slice(0, lastDecimalIndex) + filtered.slice(lastDecimalIndex + 1);
    }

    // Ограничаваме до 2 десетични знака
    let parts = filtered.split(/[.,]/);
    if (parts.length > 1 && parts[1].length > 2) {
        // Ограничаваме десетичната част до 2 знака
        let decimalSeparator = filtered.includes(',') ? ',' : '.';
        filtered = parts[0] + decimalSeparator + parts[1].substring(0, 2);
    }

    // Ако стойността е променена, актуализираме полето
    if (value !== filtered) {
        input.value = filtered;
    }

    return filtered;
}

// Настройка на първа двойка (Дължимо) с conveert()
const due1 = document.getElementById('due1');
const due2 = document.getElementById('due2');

due1.addEventListener('input', function (e) {
    const validated = validateInput(this);
    if (validated) {
        const converted = conveert(validated, 'eurToBgn');
        due2.value = converted;
        due2.classList.add('changed');
        setTimeout(() => due2.classList.remove('changed'), 300);
    } else if (this.value === '') {
        due2.value = '';
    }
    // Преизчисляваме рестото при промяна на дължимото
    if (typeof calculateResto === 'function') {
        calculateResto();
    }
});

due2.addEventListener('input', function (e) {
    const validated = validateInput(this);
    if (validated) {
        const converted = conveert(validated, 'bgnToEur');
        due1.value = converted;
        due1.classList.add('changed');
        setTimeout(() => due1.classList.remove('changed'), 300);
    } else if (this.value === '') {
        due1.value = '';
    }
    // Преизчисляваме рестото при промяна на дължимото
    if (typeof calculateResto === 'function') {
        calculateResto();
    }
});

// Настройка на втора двойка (Платено) с динамично изчисляване на разлика
const paid1 = document.getElementById('paid1');
const paid2 = document.getElementById('paid2');
const resto1 = document.getElementById('resto1');
const resto2 = document.getElementById('resto2');

// (Labels elements removed as requested)

// Глобално състояние дали сме в режим "Ръчно въвеждане"
let manualInputMode = null;

// Функция за изчисляване на ресто от двете платени полета
// Функция за изчисляване на ресто от двете платени полета
function calculateResto() {
    // Нулираме ръчния режим, защото промяна в Платено/Дължимо рестартира логиката
    resetRestoManuals();

    // Извикваме общата логика - тя ще си види че flags са false и ще мине в Default
    recalculateRestoMixed();
}

paid1.addEventListener('input', function (e) {
    validateInput(this);
    calculateResto();
});

paid2.addEventListener('input', function (e) {
    validateInput(this);
    calculateResto();
});


// Функция за изтриване на поле
// Функция за изтриване на поле
function clearField(fieldId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    const field = document.getElementById(fieldId);
    field.value = '';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.focus();
}

// Глобални флагове за ръчно въведено
let isManualResto1 = false;
let isManualResto2 = false;

window.resetRestoState = function () {
    isManualResto1 = false;
    isManualResto2 = false;
    recalculateRestoMixed();
};

// Помощна функция за "безопасно" обновяване на поле
// Обновява value само ако полето НЕ е ръчно въведено от потребителя
function updateFieldIfNotManual(field, newVal, isManualFlag) {
    if (!isManualFlag) {
        field.value = newVal;
    }
}

// Обща функция за преизчисляване при промяна на Resto
function recalculateRestoMixed() {
    const rate = typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583;

    // Определяме водещата валута според активния елемент или activeRestoField
    let useBgnAsMaster = false;
    let focusSource = 'none';

    let currentFocus = document.activeElement;
    // Check if activeElement is one of ours
    if (!currentFocus || !currentFocus.id || !['due1', 'due2', 'paid1', 'paid2', 'resto1', 'resto2'].includes(currentFocus.id)) {
        // Fallback to activeRestoField
        if (activeRestoField && ['due1', 'due2', 'paid1', 'paid2', 'resto1', 'resto2'].includes(activeRestoField.id)) {
            currentFocus = activeRestoField;
            focusSource = 'activeRestoField';
        }
    } else {
        focusSource = 'activeElement';
    }

    if (currentFocus && currentFocus.id) {
        if (['due2', 'paid2', 'resto2'].includes(currentFocus.id)) {
            useBgnAsMaster = true;
        }
    }

    // Ако не сме успели да определим фокус, но имаме въведено Paid2 > 0 и няма Paid1,
    // или ако въвеждаме в Paid2, предполагаме BGN.
    // Но по-горе логиката за fallback трябва да го покрие.

    // Взимаме стойностите
    const due1Val = parseFloat(due1.value.replace(',', '.')) || 0;
    const due2Val = parseFloat(due2.value.replace(',', '.')) || 0;
    const paid1Val = parseFloat(paid1.value.replace(',', '.')) || 0;
    const paid2Val = parseFloat(paid2.value.replace(',', '.')) || 0;

    // FIX: Ако paid1 e 0 (изтрито), смятаме по due2 - paid2 (BGN master),
    // за да избегнем грешки от превалутиране при визуализацията на BGN рестото.
    if (paid1Val === 0) {
        useBgnAsMaster = true;
    }

    let baseBalance = 0; // Negative means remaining change (ресто), Positive means due (дължимо)

    if (useBgnAsMaster) {
        // Смятаме в ЛЕВА - Стриктно последователно по визуализация

        // 1. Взимаме визуалното Дължимо (Лева), както е на екрана.
        // Потребителят иска да ползваме due2Val (107.57), а не да преизчисляваме от due1.
        let startDueBgn = due2Val;

        // 2. Взимаме визуалното Платено (Евро) конвертирано и закръглено
        const paid1Bgn = roundToTwo(paid1Val * rate);

        // 3. Смятаме остатък ПРЕДИ второто плащане 
        // (това е "изчислената стойност за resto2" преди намесата на paid2)
        // Закръгляме и тук, за да фиксираме сумата "29.34"
        const intermediateResto = roundToTwo(startDueBgn - paid1Bgn);

        // 4. Вадим второто плащане
        // 29.34 - 29.00 = 0.34
        baseBalance = roundToTwo(intermediateResto - paid2Val);
    } else {
        // Смятаме в ЕВРО
        const totalPaidEur = paid1Val + (paid2Val / rate);
        baseBalance = due1Val - totalPaidEur; // в EUR
    }

    // Manual fields logic
    let manualRestoEur = 0;
    let manualRestoBgn = 0;

    if (isManualResto1) {
        manualRestoEur = parseFloat(resto1.value.replace(',', '.')) || 0;
    }
    if (isManualResto2) {
        manualRestoBgn = parseFloat(resto2.value.replace(',', '.')) || 0;
    }

    // Calculate final remaining
    // We need to apply manual adjustments.
    // If baseBalance is BGN, we convert manuals to BGN to subtract.
    // If baseBalance is EUR, we convert manuals to EUR.

    let finalRemaining = 0; // In Master Currency

    if (useBgnAsMaster) {
        // Base is BGN
        // Adjust logic:
        // If Due (Positive): Remaining = Base - (Manual1*Rate + Manual2)
        // If Change (Negative): Remaining = Base + (Manual1*Rate + Manual2)
        const totalManualBgn = (manualRestoEur * rate) + manualRestoBgn;

        if (baseBalance >= 0) {
            finalRemaining = baseBalance - totalManualBgn;
        } else {
            finalRemaining = baseBalance + totalManualBgn;
        }
    } else {
        // Base is EUR
        const totalManualEur = manualRestoEur + (manualRestoBgn / rate);

        if (baseBalance >= 0) {
            finalRemaining = baseBalance - totalManualEur;
        } else {
            finalRemaining = baseBalance + totalManualEur;
        }
    }

    finalRemaining = roundToTwo(finalRemaining);

    // Update Visuals and Non-Manual Fields
    let displayEur = 0;
    let displayBgn = 0;

    if (useBgnAsMaster) {
        displayBgn = finalRemaining;
        displayEur = finalRemaining / rate;
    } else {
        displayEur = finalRemaining;
        displayBgn = finalRemaining * rate;
    }

    // Update NON-manual fields
    if (!isManualResto1) {
        const absEur = Math.abs(displayEur);
        resto1.value = absEur > 0.005 ? absEur.toFixed(2).replace('.', ',') : '';
    }
    if (!isManualResto2) {
        const absBgn = Math.abs(displayBgn);
        resto2.value = absBgn > 0.005 ? absBgn.toFixed(2).replace('.', ',') : '';
    }

    // Update visuals (colors, labels) based on the EUR value (as used in existing updateRestoVisuals)
    let mode = 'default';
    if (isManualResto1 && !isManualResto2) mode = 'manual_left';
    else if (!isManualResto1 && isManualResto2) mode = 'manual_right';
    else if (isManualResto1 && isManualResto2) mode = 'manual_both'; // Fallback to handle both? Logic in visual func needs check.

    // updateRestoVisuals expects value in EUR to determine Positive/Negative red/green
    updateRestoVisuals(displayEur, mode);
}


// Настройка на трета двойка (Ресто)
// Настройка на трета двойка (Ресто)
resto1.addEventListener('focus', function (e) {
    const totalBase = calculateTotalResto();
    const isGreen = totalBase < -0.005;

    // Разрешаваме редакция само ако има ресто за връщане (зелено)
    // ИЛИ ако вече сме в ръчен режим (за да можем да редактираме)
    if (!isGreen && !isManualResto1) {
        this.blur();
        return;
    }

    // Ако полето не е било ръчно, го правим ръчно и го ЧИСТИМ 
    if (!isManualResto1) {
        isManualResto1 = true;
        isManualResto2 = false; // Reset other field to calculated
        this.value = '';
        recalculateRestoMixed();
    }
});

resto1.addEventListener('input', function (e) {
    if (!isManualResto1) {
        isManualResto1 = true;
        isManualResto2 = false;
    }
    validateInput(this);
    recalculateRestoMixed();
});

resto2.addEventListener('focus', function (e) {
    const totalBase = calculateTotalResto();
    const isGreen = totalBase < -0.005;

    // Разрешаваме редакция само ако има ресто (зелено) или сме в режим редакция
    if (!isGreen && !isManualResto2) {
        this.blur();
        return;
    }

    if (!isManualResto2) {
        isManualResto2 = true;
        isManualResto1 = false; // Reset other field to calculated
        this.value = '';
        recalculateRestoMixed();
    }
});

resto2.addEventListener('input', function (e) {
    if (!isManualResto2) {
        isManualResto2 = true;
        isManualResto1 = false;
    }
    validateInput(this);
    recalculateRestoMixed();
});

// Reset функция (вика се от calculateResto - main entry point from Paid/Due input)
function resetRestoManuals() {
    isManualResto1 = false;
    isManualResto2 = false;
}

// Помощна функция за изчисляване на общото ресто
function calculateTotalResto() {
    const due1Value = parseFloat(due1.value.replace(',', '.')) || 0;
    const paid1Value = parseFloat(paid1.value.replace(',', '.')) || 0;
    const paid2Value = parseFloat(paid2.value.replace(',', '.')) || 0;
    const paid2InEur = paid2Value / (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583);
    const totalPaidInEur = paid1Value + paid2InEur;
    return due1Value - totalPaidInEur;
}

// Помощна функция за обновяване на цветовете (bez e-labeli)
// mode: 'default' | 'manual_left' | 'manual_right'
function updateRestoVisuals(remainingEur, mode) {
    // 1. Нулиране на класове
    resto1.classList.remove('resto-positive', 'resto-negative', 'resto-manual');
    resto2.classList.remove('resto-positive', 'resto-negative', 'resto-manual');

    const epsilon = 0.005;

    // 2. Логика според режима
    if (mode === 'default') {
        // Цветове - и двете полета
        if (remainingEur > epsilon) {
            resto1.classList.add('resto-positive');
            resto2.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto1.classList.add('resto-negative');
            resto2.classList.add('resto-negative');
        }

    } else if (mode === 'manual_left') {
        // Лявото поле е ръчно (жълто)
        resto1.classList.add('resto-manual');
        // Дясното поле си взема цвета
        if (remainingEur > epsilon) {
            resto2.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto2.classList.add('resto-negative');
        }

    } else if (mode === 'manual_right') {
        // Дясното поле е ръчно (жълто)
        resto2.classList.add('resto-manual');
        // Лявото поле си взема цвета
        if (remainingEur > epsilon) {
            resto1.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto1.classList.add('resto-negative');
        }
    }
}

// Форматиране при загуба на фокус (blur) за всички текстови полета
document.querySelectorAll('input[type="text"]').forEach(input => {
    input.addEventListener('blur', function () {
        // Ако полето все още е "виртуално активно" (т.е. работим с калкулатора),
        // не го форматираме веднага. Ще го форматираме, когато активността падне.
        if (this.classList.contains('active-virtual-focus')) return;

        let val = this.value.replace(',', '.');
        if (val === '') return;

        let num = parseFloat(val);
        if (!isNaN(num)) {
            // Ако е 0 или много близко до 0 -> изчистваме
            if (Math.abs(num) < 0.005) {
                this.value = '';
            } else {
                // Иначе форматираме до 2 знака
                this.value = num.toFixed(2).replace('.', ',');
            }
        }
    });
});
*/