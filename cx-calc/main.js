    const rows = 5;
    const cols = 4;
    const container = document.querySelector('.calculator-container');
    const displaylv = document.querySelector('#levInput');
    const display = document.querySelector('#eurInput');
    var calculator = null; // Изображението на калкулатора
    var calcBottom = 0;

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
    var showWarning = false; // Флаг за показване на предупреждение за курса
    // Променливи за Web Audio API за по-бърз звук
    let audioContext;
    let clickBuffer = null;

    const MAX_HISTORY_ITEMS = 30;
    const historyButton = document.getElementById('historyButton');
    const recallButton = document.getElementById('recallButton');
    //const hModalOverlay = document.getElementById('hisModalOverlay');
    const settingsModal = document.getElementById('settingsModal');
    const historyList = document.getElementById('historyList');
    const closeHistoryModalButton = document.getElementById('closeHistoryModalButton');
    const closeHelpModalButton = document.getElementById('closeHelpModalButton');

    var MainPointsO = {
        Keys:       {x: 43, y: 235},
        KeySize:    {x: 84, y: 70},
        KbdGaps:    {x: 13, y: 13},
        Display:    {x: 102, y: 33},
        Displaylv:  {x: 102, y: 110},
        DisplaySize:{x: 312, y: 57},
        Status:     {x: -10, y: 185},
        StatusSize: {x: 45, y: 15},
        CurrencyOffset: {x: -40, y: 15},
        CurrencyLevOffset: {x: -40, y: 15}
    };

    // Обект с настройките по подразбиране
    const defaultSettings = {
        exchangeRate: 1.95583,
        currencySymbol: '€',
        currencyLevSymbol: 'лв.',
        soundEffectsEnabled: false,
        showRateWarningEnabled: true,
        
        calcBottomOffset: 0,
        initialDisplay: 'lev', // 'eur' или 'lev'
        pwaInstallDeclined: false,
        calculatorSkin: 'Calculator0.png' // Скин по подразбиране
    };

    // Инициализираме глобалните променливи директно от defaultSettings.
    var EXCHANGE_RATE = defaultSettings.exchangeRate;
    var CURRENCY_SYMBOL = defaultSettings.currencySymbol;
    var CURRENCY_LEV_SYMBOL = defaultSettings.currencyLevSymbol;
    var showRateWarningEnabled = defaultSettings.showRateWarningEnabled;
    var soundEffectsEnabled = defaultSettings.soundEffectsEnabled;

    function saveSettings() {
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
        localStorage.setItem('MainPointsO', JSON.stringify(MainPointsO));

        // 2. Събираме и записваме останалите настройки в appSettings
        const currentSettings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
        // Събираме и записваме останалите настройки в appSettings
        const newAppSettings = {
            exchangeRate: parseFloat(document.getElementById('exchangeRateInput').value) || defaultSettings.exchangeRate,
            currencySymbol: document.getElementById('currencySymbolInput').value.trim() || defaultSettings.currencySymbol,
            currencyLevSymbol: document.getElementById('currencyLevSymbolInput').value.trim() || defaultSettings.currencyLevSymbol,
            showRateWarningEnabled: document.getElementById('rateWarningCheckbox').checked,
            soundEffectsEnabled: document.getElementById('soundEffectsCheckbox').checked,
            calcBottomOffset: parseInt(document.getElementById('calcBottomOffset').value, 10) || 0,
            initialDisplay: document.getElementById('initialDisplayLev').checked ? 'lev' : 'eur',
            pwaInstallDeclined: currentSettings.pwaInstallDeclined || defaultSettings.pwaInstallDeclined,
            calculatorSkin: currentSettings.calculatorSkin || defaultSettings.calculatorSkin // Запазваме текущия скин
        };
        localStorage.setItem('appSettings', JSON.stringify(newAppSettings));

        // --- ПРИЛАГАНЕ НА ПРОМЕНИТЕ ---
        // 3. Презареждаме страницата, за да се приложат всички промени консистентно
        console.log("Настройките са запазени. Страницата ще бъде презаредена.");
        location.reload();
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
                    } else {
                        console.warn(`Input element with ID '${inputId}' not found for MainPointsO.${key}.${prop}`);
                    }
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
      const calcBottomOffsetInput = document.getElementById('calcBottomOffset');
      if (calcBottomOffsetInput) {
          // Вземи текущата стойност от CSS променливата или по подразбиране 100
          const val = getComputedStyle(document.documentElement).getPropertyValue('--calc-bottom-offset').trim() || "0px";
          calcBottomOffsetInput.value = parseInt(val, 10);
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
    }

    function loadSettings() {
        const savedSettings = JSON.parse(localStorage.getItem('appSettings'));
        // Слива запазените настройки с тези по подразбиране, за да се гарантира, че всички ключове съществуват.
        // Запазените стойности имат предимство.
        const settings = { ...defaultSettings, ...savedSettings };
        // Прилага настройките към глобалните променливи на приложението
        EXCHANGE_RATE = settings.exchangeRate;
        CURRENCY_SYMBOL = settings.currencySymbol;
        CURRENCY_LEV_SYMBOL = settings.currencyLevSymbol;
        showRateWarningEnabled = settings.showRateWarningEnabled;
        soundEffectsEnabled = settings.soundEffectsEnabled;
        calcBottom = settings.calcBottomOffset;
        // Задаваме активния дисплей при стартиране според запазената стойност
        levMode = (settings.initialDisplay === 'lev');

        // Зареждаме паметта отделно от 'CalcMem', тъй като тя се управлява от status.js
        const savedMem = JSON.parse(localStorage.getItem('CalcMem'));
        if (savedMem && Array.isArray(savedMem)) {
            Mem = savedMem;
        } // Ако няма запазена памет, използваме първоначално декларираната празна Mem.

        // Задаваме облика на калкулатора според запазената настройка
        if (calculator && settings.calculatorSkin) {
            calculator.src = settings.calculatorSkin;
        }

        // Прилага визуални настройки, които са нужни веднага при зареждане
        document.documentElement.style.setProperty('--calc-bottom-offset', `${calcBottom}px`);
        // Проверява дали да покаже предупреждение за курса, ако е различен от стандартния
        if (EXCHANGE_RATE !== defaultSettings.exchangeRate) {
            showWarning = true;
        }
        // Зареждане на MainPointsO от localStorage
        const savedMainPointsO = localStorage.getItem('MainPointsO');
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
        let containerWidth = document.body.clientWidth;
        let containerHeight = document.body.clientHeight;
        if (!calculator) {
            console.error("Грешка: Не е намерено изображението.");
            return;
        }
        let aspectRatio = calculator.naturalWidth / calculator.naturalHeight;
        if (calculator.style.objectFit === "cover") {
            imageWidth = containerWidth;
            imageHeight = containerHeight;
        } else if (calculator.style.objectFit === "contain") {
            if (containerWidth / containerHeight > aspectRatio) {
                imageHeight = containerHeight;
                imageWidth = Math.round(containerHeight * aspectRatio);
                console.log("(contain) - Изображението е по-широко от контейнера, използваме височината на контейнера.");
            } else {
                imageWidth = containerWidth;
                imageHeight = Math.round(containerWidth / aspectRatio);
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
    }

    function getKeyValue(row, col) {
        const keyMap = [
            ["L", "€", "C", "B"],
            ["7", "8", "9", "/"],
            ["4", "5", "6", "*"],
            ["1", "2", "3", "-"],
            ["0", ",", "=", "+"]
        ];
        return keyMap[row][col];
    }

    function formatNumber(num) {
        if (isNaN(num)) return '';
        return num.toFixed(2).replace('.', ',');
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
            if (decimalPart === "" || decimalPart === ",") {
                decimalPart = ",00";
            } else if (decimalPart.length === 2) {
                // If there's only one digit after the comma, add a zero
                decimalPart += "0";
            }
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
        // Регулярният израз открива последното число с 2 цифри след запетая без аритметичен символ след него
        const regex = /(\d+,\d{2})(?![+\-*/])/;
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
                    activeDisplayText = groupByThree(userInput, true); // Форматираме го като "12,00"
                } else { // Ако все още има десетична част (напр. "12,34" -> "12,3" или "12,3" -> "12,")
                    activeDisplayText = groupByThree(userInput, false); // Показваме го точно както е
                }
            } else { // Режим на нормално въвеждане (цифра или запетая)
                if (isWholeNumber) { // Ако е цяло число (напр. "12")
                    activeDisplayText = groupByThree(userInput, true); // Форматираме го като "12,00"
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
        levMode = !levMode;
        const newActiveValue = levMode
            ? displaylv.textContent
            : display.textContent;
        userInput = newActiveValue.replace(/\s/g, ''); // премахване на интервали
        // Ако стойността е цяло число, форматирано с ",00", премахваме десетичната част.
        if (userInput.endsWith(',00')) {
            userInput = userInput.slice(0, -3);
        }
        console.log("Променен режим - userInput:", userInput);
        updateDisplays(userInput, userInput.replace(/\*/g, "×").replace(/\//g, "÷"), 'L');
    }

    function balanceBrackets(str){
        let open = 0;
        for (const c of str) if (c === '(') open++; else if (c === ')') open--;
        return str + ')'.repeat(Math.max(0, open));
    }

    function addImplicitMultiplication(expression) {
        // 3( -> 3*( | )3 -> )*3 | )( -> )*(
        return expression
            .replace(/(\d)(?=\()/g, '$1*')   // Digit followed by (
            .replace(/(?<=\))(\d)/g, '*$1')   // Digit preceded by )
            .replace(/\)\(/g, ')*(');        // A ) followed by a (
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
                    result = parseFloat(result).toFixed(2);
                    userInput = result.toString().replace(/\./g, ',');
                    navigator.clipboard.writeText(userInput)
                    .then(() => {
                        console.log("Резултатът е копиран в клипборда! ✅"); })
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
                if (decimalPart.length >= 2) return;
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
                    userInput = parseFloat(result).toFixed(2).replace(/\./g, ',') + value;
                    let levValue = parseNumber(displaylv.textContent);
                    let eurValue = parseNumber(display.textContent);
                    addHistoryEntry(oldUserInput, result, "no"); // записва междинен резултат
                } catch (error) {
                    console.error("Грешка в изчисленията", error);
                }
            } else {
                if (canAddCharacter(userInput, value)) {
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
        if (userInput.endsWith(',00')) {
            userInput = userInput.slice(0, -3);
        }        
        console.log("userInput = ", userInput);
    }

    function getKeyColumnIndex(key) {
        const rect = calculator.getBoundingClientRect();
        const colWidth = MainPoints.KeySize.x + MainPoints.KbdGaps.x;
        const relativeX = (key.x - rect.left - MainPoints.Keys.x) / colWidth;
        return Math.round(relativeX+1); // Връща 1, 2, 3 или 4
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
                .toFixed(2)
                .replace('.', ',');
            appendNumber("=");
            // console.log("Ctrl+%: ", userInput);
        }  else if (key.value === '-') {
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
                .toFixed(2)
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
            if (statusEl && getComputedStyle(statusEl).opacity > 0) {
                const rect = statusEl.getBoundingClientRect();
                const withinBounds = (
                    event.clientX >= rect.left &&
                    event.clientX <= rect.right &&
                    event.clientY >= rect.top &&
                    event.clientY <= rect.bottom
                );
                if (withinBounds && i == 4) {
                    if (isCtrlRequired) {
                        memoryShow(4);
                    } else {
                        helpModal.style.display = 'flex'; // Показваме модалния прозорец
                        modalIsActive = true;
                    }
                    return true; // Връщаме true, за да покажем, че кликът е обработен
                }
                if (withinBounds) {
                    isCtrlRequired ? memoryShow(i) : memoryRecall(i);
                    return true; // Връщаме true, за да покажем, че кликът е обработен
                }
            }
        }
        return false; // Връщаме false, ако кликът не е върху активна зона
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
        return parseFloat(result).toFixed(2).replace('.', ',');
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
        localStorage.setItem('CalcMem', JSON.stringify(Mem));
    }

    async function pasteNumber() {
        try {
            const clipboardText = await navigator.clipboard.readText();
            const cleanedText = clipboardText.replace(/(?<=\d)\s+(?=\d)/g, '');
            const match = cleanedText.match(/-?\d+[.,]?\d*/);
            if (match) {
                let rawNumber = match[0];
                let normalized = rawNumber.replace(',', '.');
                let rounded = parseFloat(normalized).toFixed(2);
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

    function switchNumber() {
        appendNumber("="); // за да запомним числото от активния дисплей в клипборда
        appendNumber("C"); // изтриваме дисплея
        appendNumber("L"); // превключваме дисплея
        pasteNumber(); // поставяме числото от клипборда
    }

    function allClear() {
        appendNumber("C"); // изтриваме дисплея
        userInput = ""; // изчистваме userInput
        Mem = [0, 0, 0, 0]; // изчистваме паметта
        localStorage.setItem('CalcMem', JSON.stringify(Mem)); // запазваме паметта
        document.getElementById("clearHistoryButton").click(); // изтриваме историята, ако е налична
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
                // Обработка на специални клавиши
                if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '€') {
                    if (ovFlag) { noOverlay(); ovFlag = false; }
                    settingsModal.style.display = 'flex';
                    modalIsActive = true;
                    populateLayoutSettings();
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'B') {
                    clearAllMemory();
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '0') {
                    appendNumber("(");
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === ',') {
                    appendNumber(")");
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '+') {
                    toggleFullscreen();
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === '/') {
                    pasteNumber();
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'L') {
                    switchNumber();
                } else if ((event.ctrlKey || options.allowWithoutCtrl) && keyValue === 'C') {
                    allClear();
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
                toggleDisplayMode();
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
            if (isOutsideContainer) {
                if (confirm('Сигурни ли сте, че искате да върнете първоначалните настройки?')) {
                    // Добавяме и изтриване на историята при нулиране
                    if (typeof clearHistory === 'function') {
                        clearHistory();
                        console.log('Историята е изтрита.');
                    }
                    localStorage.removeItem('MainPointsO');
                    localStorage.removeItem('appSettings');
                    console.log('Всички запазени настройки (MainPointsO, appSettings) са изтрити.');
                    location.reload();
                }
            }
        }
        // Звук, ако е имало валидно взаимодействие
        if (interactionHandled) {
            playClickSound();
        }
    }

    document.addEventListener("click", function(event) {
        handleCalculatorInteraction(event);
    });

    document.addEventListener("contextmenu", function(event) {
        event.preventDefault(); // блокира контекстното меню
        handleCalculatorInteraction(event, { allowWithoutCtrl: true });
    });

    document.getElementById('saveSettings').addEventListener('click', function(e) {
        saveSettings();
        settingsModal.style.display = 'none'; // Close modal after saving
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    });

    document.getElementById('closeSettingsModalButton').addEventListener('click', function(e) {
        settingsModal.style.display = 'none'; // Close modal without saving
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    });

    window.addEventListener("load", function() {
        try {
            calculator = document.querySelector(".calculator-img");

            // Изчисленията се правят ВЕДНЪГА, базирано на Calculator0.png,
            // тъй като размерите на скиновете са идентични.
            getImageSize();
            getImageVisualSize();
            scaleMainPoints(aspectRatioW, aspectRatioH);
            const layout = calcNewCoordinates();
            keys = layout.keys;
            displayCoords = layout.displayCoords;
            resizeFont();

            // ЕДВА СЛЕД изчисленията, зареждаме настройките, които може да сменят скина.
            loadSettings();
            initAudio();

            // Прилагаме символите за валута
            document.getElementById('currency').textContent = CURRENCY_SYMBOL;
            document.getElementById('currencyLev').textContent = CURRENCY_LEV_SYMBOL;

            // --- ПРЕДУПРЕЖДЕНИЕ ЗА КУРСА ---
            if (showWarning && showRateWarningEnabled) {
                const warning = document.getElementById('exchangeRateWarning');
                warning.style.display = 'flex';
                modalIsActive = true;
                document.getElementById('exchangeRateChangeBtn').onclick = function() {
                    const settings = JSON.parse(localStorage.getItem('appSettings')) || defaultSettings;
                    settings.exchangeRate = defaultSettings.exchangeRate;
                    localStorage.setItem('appSettings', JSON.stringify(settings));
                    modalIsActive = false;
                    location.reload();
                };
                document.getElementById('exchangeRateConfirmBtn').onclick = function() {
                    warning.style.display = 'none';
                    modalIsActive = false;
                };
            }

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
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Затваряне на модал с ESC клавиш
        document.addEventListener('keydown', (e) => {
            const key = e.key;
            // Escape винаги работи за затваряне на модални прозорци
            if (key === 'Escape' || key === 'Esc') {
                historyModal.style.display = 'none';
                helpModal.style.display = 'none';
                settingsModal.style.display = 'none';
                modalIsActive = false;
                return;
            }
            // Блокираме другите клавиши, ако има отворен модален прозорец
            if (modalIsActive) {
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
                userInput = (parseFloat(userInput) / 100).toFixed(2).replace('.', ',');
                appendNumber("=");
                return;
            }
            const keyMap = { 'Enter': '=', '=': '=', 'Backspace': 'B', 'Delete': 'B', ',': ',', '.': ',', 'c': 'C', 'C': 'C', '(': '(', ')': ')' };
            if (keyMap[key]) {
                appendNumber(keyMap[key]);
            } else if ("0123456789+-*/".includes(key)) {
                appendNumber(key);
            }
        });
        loadHistory();
        // Initial font size adjustment for both fields based on their (potentially empty) content
        adjustFontSize(levInput, eurInput);
        isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        appendNumber("C");
    });

    // Следене на преоразмеряването на прозореца
    window.addEventListener("resize", function (e) {
        getImageVisualSize();
        scaleMainPoints(aspectRatioW, aspectRatioH);
        const layout = calcNewCoordinates();
        keys = layout.keys;
        displayCoords = layout.displayCoords;
        adjustFontSize(levInput, eurInput)
    })

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
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    }

    // Деактивирай по време на разработка, за да не кешира и се зарежда винаги
/*    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
        .then(reg => {
        console.log('Service Worker регистриран:', reg);
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
            console.log('Налична е нова версия!');
            // Създай визуално съобщение
            const notice = document.createElement('div');
            notice.textContent = 'Налична е нова версия. Страницата ще се презареди...';
            notice.style.position = 'fixed';
            notice.style.top = '10px';
            notice.style.left = '50%';
            notice.style.transform = 'translateX(-50%)';
            notice.style.background = '#0078d4';
            notice.style.color = '#fff';
            notice.style.padding = '12px 20px';
            notice.style.borderRadius = '6px';
            notice.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            notice.style.zIndex = '9999';
            notice.style.fontFamily = 'sans-serif';
            notice.style.opacity = '1';
            notice.style.transition = 'opacity 1s ease-out';
            document.body.appendChild(notice);
            notice.style.width = '80%';
            notice.style.maxWidth = '300px';
            notice.style.textAlign = 'center';            // Fade-out след 4 секунди
            setTimeout(() => {
                notice.style.opacity = '0';
            }, 4000);
            // Презареди след 5 секунди
            setTimeout(() => {
                window.location.reload();
            }, 5000);
            }
        });
        })
        .catch(err => {
        console.error('Грешка при регистрация на Service Worker:', err);
        });
    }

    let deferredPrompt;
    if (localStorage.getItem('pwaInstallDeclined') === 'true') {
        console.log('Потребителят вече е отказал инсталацията.');
    } else {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const bar = document.getElementById('install-bar');
            const installBtn = document.getElementById('install');
            const dismissBtn = document.getElementById('dismiss');
            bar.style.display = 'flex';
            let countdown = 20;
            installBtn.textContent = `Инсталиране (${countdown})`;
            const interval = setInterval(() => {
                countdown--;
                installBtn.textContent = `Инсталиране (${String(countdown).padStart(2, '0')})`;
                if (countdown <= 0) cleanup();
            }, 1000);
            const installHandler = () => {
                deferredPrompt.prompt();
                deferredPrompt = null;
                cleanup();
            };
            const dismissHandler = () => {
                localStorage.setItem('pwaInstallDeclined', 'true');
                deferredPrompt = null;
                cleanup();
            };
            function cleanup() {
                clearInterval(interval);
                bar.style.display = 'none';
                installBtn.removeEventListener('click', installHandler);
                dismissBtn.removeEventListener('click', dismissHandler);
            }
            installBtn.addEventListener('click', installHandler);
            dismissBtn.addEventListener('click', dismissHandler);
        });
    }
*/