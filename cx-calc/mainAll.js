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
    let layoutSettingsVisible = false; // Следи дали са показани настройките за зони (Settings2)
    var showWarning = false; // Флаг за показване на предупреждение за курса
    var tipsEnabled = true; // Флаг за показване на подсказки
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
    const clearHistoryButton = document.getElementById('clearHistoryButton');
    const closeHelpModalButtonTop = document.getElementById('closeHelpModalButtonTop');

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
        tipsEnabled: true, // Показване на подсказки при стартиране
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
            calcBottomOffset: parseInt(document.getElementById('calcBottomOffset').value, 10) || 0,
            initialDisplay: document.getElementById('initialDisplayLev').checked ? 'lev' : 'eur',
            tipsEnabled: document.getElementById('tipsEnabledCheckbox').checked,
            pwaInstallDeclined: currentSettings.pwaInstallDeclined || defaultSettings.pwaInstallDeclined,
            calculatorSkin: currentSettings.calculatorSkin || defaultSettings.calculatorSkin // Запазваме текущия скин
        };
        localStorage.setItem('CXCalc_appSettings', JSON.stringify(newAppSettings));

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
      // Попълваме checkbox-а за подсказките
      const tipsEnabledCheckbox = document.getElementById('tipsEnabledCheckbox');
      if (tipsEnabledCheckbox) {
          tipsEnabledCheckbox.checked = tipsEnabled;
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
        // Задаваме активния дисплей при стартиране според запазената стойност
        levMode = (settings.initialDisplay === 'lev');

        // Зареждаме паметта отделно от 'CalcMem', тъй като тя се управлява от status.js
        const savedMem = JSON.parse(localStorage.getItem('CXCalc_CalcMem'));
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

    /*/ --- Визуализация на активна валута с bullet ---
    const currencyLevEl = document.getElementById('currencyLev');
    const currencyEurEl = document.getElementById('currency');
    if (levMode) {
        currencyLevEl.textContent = `• ${CURRENCY_LEV_SYMBOL}`;
        currencyEurEl.textContent = CURRENCY_SYMBOL;
    } else {
        currencyLevEl.textContent = CURRENCY_LEV_SYMBOL;
        currencyEurEl.textContent = `• ${CURRENCY_SYMBOL}`;
    } */

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
                            helpModal.style.display = 'flex'; // Показване на помощ
                            modalIsActive = true;
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
                    localStorage.removeItem('CXCalc_MainPointsO');
                    localStorage.removeItem('CXCalc_appSettings');
                    console.log('Всички запазени настройки (CXCalc_MainPointsO, CXCalc_appSettings) са изтрити.');
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
        resetLayoutSettingsView();
        setTimeout(() => {
            modalIsActive = false;
        }, 0);
        e.stopPropagation();
        e.preventDefault();
    });

    window.addEventListener("load", function() {
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
                resizeFont();

                // --- START OF TIPS INTEGRATION ---
                if (typeof initTips === 'function' && typeof showTips === 'function') {
                    initTips(); // Initialize tips without coordinates
                    if (tipsEnabled) {
                        showTips('Single'); // Show the first available tip on load
                    }
                }
                // --- END OF TIPS INTEGRATION ---
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
                const warning = document.getElementById('exchangeRateWarning');
                // Тъй като HTML вече е с правилната структура (.modal),
                // просто трябва да го покажем и да закачим event handlers.
                const closeWarning = (event) => {
                    // Спираме разпространението на клика, за да не задейства бутони под модала.
                    if (event) event.stopPropagation();
                    warning.style.display = 'none';
                    modalIsActive = false;
                };

                warning.style.display = 'flex'; // Показваме модала
                modalIsActive = true;
                document.getElementById('exchangeRateChangeBtn').onclick = function(event) {
                    if (event) event.stopPropagation();
                    const settings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || defaultSettings;
                    settings.exchangeRate = defaultSettings.exchangeRate;
                    localStorage.setItem('CXCalc_appSettings', JSON.stringify(settings));
                    location.reload(); // Презареждането ще скрие модала
                };
                document.getElementById('exchangeRateConfirmBtn').onclick = function(event) {
                    closeWarning(event);
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
        // Скриване на съобщението за зареждане
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            // Плавно изчезване
            loadingOverlay.style.opacity = '0';
            setTimeout(() => { loadingOverlay.style.display = 'none'; }, 500); // Премахваме го след анимацията
        }
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
            if (iosPrompt && dismissIosBtn && declineIosBtn) {
                iosPrompt.style.display = 'flex';
                // Бутонът 'Отказ' скрива банера и запазва избора за постоянно
                declineIosBtn.addEventListener('click', () => {
                    iosPrompt.style.display = 'none';
                    localStorage.setItem('CXCalc_pwaInstallDeclined', 'true');
                }, { once: true });
                // Бутонът 'x' само скрива банера за текущата сесия
                dismissIosBtn.addEventListener('click', () => {
                    iosPrompt.style.display = 'none';
                }, { once: true });
            }
        }
        // Задаваме началното състояние на дисплеите, СЛЕД като настройките са заредени.
        appendNumber("C");
    });

    document.addEventListener('DOMContentLoaded', () => {
        // Затваряне на модал с ESC клавиш

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
                event.target.style.display = 'none';

                // Ако е бил прозорецът за настройки, връщаме го в начален изглед
                if (event.target.id === 'settingsModal') {
                    resetLayoutSettingsView();
                }
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
        // Добавяме слушател за бутона за проверка на версия
        const checkVersionBtn = document.getElementById('checkVersionBtn');
        if (checkVersionBtn) checkVersionBtn.addEventListener('click', checkForUpdates);

        // --- Слушатели за бутоните за управление на подсказките ---
        const resetTipsButton = document.getElementById('resetTipsButton');
        if (resetTipsButton) {
            resetTipsButton.addEventListener('click', () => {
                if (typeof showTips === 'function') {
                    showTips('Reset');
                }
            });
        }

        const startTutorialButton = document.getElementById('startTutorialButton');
        if (startTutorialButton) {
            startTutorialButton.addEventListener('click', () => {
                // Затваряме модала за настройки
                settingsModal.style.display = 'none';
                modalIsActive = false;
                resetLayoutSettingsView();

                // Стартираме обучението
                if (typeof showTips === 'function') {
                    showTips('All');
                }
            });
        }

        // --- Динамично показване на версията от localStorage ---
        const helpFooterInfo = document.getElementById('help-footer-info');
        const emailLink = `<a href="mailto:cx.sites.online@gmail.com" style="color: inherit; text-decoration: none;">cx.sites.online@gmail.com</a>`;

        // Показваме веднага версията от localStorage. Това е единственото четене при зареждане.
        const currentVersion = localStorage.getItem('CXCalc_appVersion');
        if (helpFooterInfo) {
            const versionText = currentVersion || 'N/A';
            helpFooterInfo.innerHTML = `Версия ${versionText} &bull; Контакт: ${emailLink}`;
        }

        loadHistory();
        // Initial font size adjustment for both fields based on their (potentially empty) content
        adjustFontSize(levInput, eurInput);

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

    function resetLayoutSettingsView() {
        document.getElementById('Settings1').style.display = 'grid';
        document.getElementById('Settings2').style.display = 'none';
        layoutSettingsVisible = false;
    }

    function toggleLayoutSettingsView() {
        if (!layoutSettingsVisible) {
            // Превключваме към изглед с настройките за зоните
            document.getElementById('Settings1').style.display = 'none';
            document.getElementById('Settings2').style.display = 'grid';
            layoutSettingsVisible = true;
        } else {
            // Затваряме модала и показваме зоните върху калкулатора
            showOv(); // Тази функция вече затваря модала
            resetLayoutSettingsView(); // Връщаме изгледа в начално състояние за следващия път
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
    if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sww.js')
        .then(reg => {
        console.log('Service Worker регистриран:', reg);
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data?.type === 'NEW_VERSION_AVAILABLE') {
                console.log('Налична е нова версия:', event.data.version);
                // 1. Записваме новата версия в localStorage за следващото зареждане.
                if (event.data.version) {
                    localStorage.setItem('CXCalc_appVersion', event.data.version);
                }
                // 2. Показваме съобщението за презареждане.
                showNotification('Налична е нова версия. Презареждане...', 'success', 4000, true);
            }
        });
        })
        .catch(err => {
        console.error('Грешка при регистрация на Service Worker:', err);
        });
    }

    let deferredPrompt;
    if (localStorage.getItem('CXCalc_pwaInstallDeclined') === 'true') {
        console.log('Потребителят вече е отказал инсталацията.');
    } else {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            const installBar = document.getElementById('install-bar');
            const installButton = document.getElementById('install');
            const dismissButton = document.getElementById('dismiss');
            const countdownSpan = document.getElementById('install-countdown');

            installBar.style.display = 'flex';
            let countdown = 20;
            countdownSpan.textContent = ` (${countdown})`;

            const interval = setInterval(() => {
                countdown--;
                countdownSpan.textContent = ` (${String(countdown).padStart(2, '0')})`;
                if (countdown <= 0) cleanup();
            }, 1000);
            const installHandler = () => {
                deferredPrompt.prompt();
                deferredPrompt = null;
                cleanup();
            };
            const dismissHandler = () => {
                localStorage.setItem('CXCalc_pwaInstallDeclined', 'true');
                deferredPrompt = null;
                cleanup();
            };
            function cleanup() {
                clearInterval(interval);
                installBar.style.display = 'none';
                installButton.removeEventListener('click', installHandler);
                dismissButton.removeEventListener('click', dismissHandler);
            }
            installButton.addEventListener('click', installHandler);
            dismissButton.addEventListener('click', dismissHandler);
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

    function checkForUpdates() {
        const checkVersionBtn = document.getElementById('checkVersionBtn');

        // 1. Проверяваме за интернет връзка ПРЕДИ всичко останало.
        if (!navigator.onLine) {
            showNotification('Няма връзка с интернет. Проверката е невъзможна.', 'error');
            return; // Прекратяваме, ако сме офлайн.
        }
        if (!('serviceWorker' in navigator)) {
            showNotification('Service Worker не се поддържа.', 'error');
            return;
        }

        navigator.serviceWorker.getRegistration().then(registration => {
            if (!registration) {
                showNotification('Service Worker не е регистриран.', 'error');
                return;
            }

            // Намираме span елемента вътре в бутона, за да променяме само неговия текст.
            const btnTextSpan = checkVersionBtn.querySelector('span');
            if (!btnTextSpan) {
                console.error("Не е намерен текстов елемент (span) в бутона за проверка на версия.");
                return;
            }
            const originalText = btnTextSpan.textContent;
            btnTextSpan.textContent = 'Проверява се...';
            checkVersionBtn.disabled = true; // Деактивираме бутона, докато проверяваме.

            registration.update().then(() => {
                if (registration.installing) {
                    console.log('SW: Намерен е нов service worker, инсталира се...');
                    showNotification('Инсталира се нова версия...', 'info');
                } else if (registration.waiting) {
                    console.log('SW: Намерен е чакащ service worker. Изпраща се команда за активиране...');
                    showNotification('Активира се нова версия...', 'info');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else {
                    // Показваме съобщението само ако проверката е била успешна.
                    // В офлайн режим никога няма да стигнем дотук.
                    showNotification('Вие използвате последната версия.', 'success'); 
                }
            }).catch(error => {
                console.error('Грешка при проверка за нова версия:', error);
                showNotification('Грешка при проверката за нова версия.', 'error');
            }).finally(() => {
                if (!registration.installing && !registration.waiting) {
                    setTimeout(() => {
                        if (btnTextSpan) btnTextSpan.textContent = originalText;
                        checkVersionBtn.disabled = false;
                    }, 3000);
                }
            });
        });
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

    //memoryShow: Временно показва стойността от даден слот на паметта в горния дисплей, без да го променя
    function memoryShow(slot) {
        if (slot == 4) {
            const calculatorEl = document.getElementById("calculator");
            const newSkin = calculatorEl.src.includes("CalculatorA.png") ? "Calculator0.png" : "CalculatorA.png";
            calculatorEl.src = newSkin;

            // Запазваме новия скин в localStorage
            const settings = JSON.parse(localStorage.getItem('CXCalc_appSettings')) || {};
            settings.calculatorSkin = newSkin; // Запазваме името на файла
            localStorage.setItem('CXCalc_appSettings', JSON.stringify(settings));
            return;
        }
        if (Mem[slot] === undefined) {
            console.warn(`Памет Mem[${slot}] е недефинирана.`);
            return;
        }
        const originalValue = displaylv.textContent; // Запазваме оригиналната стойност на levInput
        const originalEurValue = display.textContent; // Запазваме оригиналната стойност на eurInput (div)
        const originalBgColor = displaylv.style.backgroundColor;
        const originalEurBgColor = display.style.backgroundColor; // Запазваме оригиналния фон на eurInput (div)
        // Форматираме и показваме стойността от паметта
        const memValueStr = groupByThree(formatNumber(Mem[slot]));
        // Показваме стойността в eurInput (div)
        display.textContent = memValueStr;
        adjustFontSize(displaylv, display);
        display.style.backgroundColor = 'rgba(255, 223, 186, 0.5)'; // Светло оранжево за индикация
        // Връщаме оригиналните стойности след 3 секунди
        setTimeout(() => {
            display.textContent = originalEurValue;
            display.style.backgroundColor = originalEurBgColor;
        }, 1000);
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
        if (status  && !ovFlag) {
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
            marker.style.width = `${2+MainPoints.StatusSize.x}px`;
            marker.style.height = `${2+MainPoints.StatusSize.y}px`;
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
            keyElement.style.position = "fixed";// "absolute";
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
        const displayCoords = {
            lv: {
                x: rect.left + MainPoints.Displaylv.x,
                y: rect.top + MainPoints.Displaylv.y
            },
            eur: {
                x: rect.left + MainPoints.Display.x,
                y: rect.top + MainPoints.Display.y
            }
        };
        // в  масива за клавишите - новите координати
        const keys = [];
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                keys.push({
                    x: rect.left + MainPoints.Keys.x + col * (MainPoints.KeySize.x + MainPoints.KbdGaps.x),
                    y: rect.top + MainPoints.Keys.y + row * (MainPoints.KeySize.y + MainPoints.KbdGaps.y),
                    value: getKeyValue(row, col)
                });
            }
        }
        const markers = [
            { label: "Долен дисплей",  id: "levInput",  coords: displayCoords.lv },
            { label: "Горен дисплей", id: "eurInput",  coords: displayCoords.eur },
            { label: "Валута",       id: "currency",  coords: { x: displayCoords.eur.x + MainPoints.CurrencyOffset.x, y: displayCoords.eur.y + MainPoints.CurrencyOffset.y } },
            { label: "Валута Лев",   id: "currencyLev", coords: { x: displayCoords.lv.x + MainPoints.CurrencyLevOffset.x, y: displayCoords.lv.y + MainPoints.CurrencyLevOffset.y } }
        ];
        markers.forEach(({ label, id, coords }) => {
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
            }
        });
        for (let i = 1; i < 5; i++) positionStatusArea(i);
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
        let entry = `${formattedLev} лв. = ${formattedEur} €`;
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
        // Израз с две числа и оператор между тях
        const regex = /(\d+(?:[.,]\d+)?)[\s]*([+\-*/×÷])[\s]*(\d+(?:[.,]\d+)?)/;
        return expression.replace(regex, (_, raw1, operator, raw2) => {
            // Унифициране: ако има запетая – я заменяме с точка
            const n1 = parseFloat(raw1.replace(',', '.'));
            const n2 = parseFloat(raw2.replace(',', '.'));
            // Форматиране: 2 знака след десетичния знак
            const formatted1 = n1.toFixed(2).replace('.', ',');
            const formatted2 = n2.toFixed(2).replace('.', ',');
            return `${formatted1} ${operator} ${formatted2}`;
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
            li.textContent = "";
            if (/[+\-*/×÷]/.test(record.operation)) {
                li.textContent = `${formatExpression(record.operation)} -> `;
            }
            li.textContent += `${record.result}`;
            // li.textContent = `${record.operation} = ${record.result}`;
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
    };

    // Clear History button
    if (clearHistoryButton) {
        clearHistoryButton.addEventListener('click', handleClearHistory);
    }

    if (closeHistoryModalButton) {
        closeHistoryModalButton.addEventListener('click', (e) => { 
            historyModal.style.display = 'none';
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
            id: 'tip-help',
            text: 'Показва подробна помощна информация за разширените функции на калкулатора. Задръжте го, за да се покажат помощни обозначения върху бутоните (на компютър: Ctrl+Клик).',
            target: 'statusArea4',
        },
        {
            id: 'tip-history-and-settings',
            text: 'История. Задръжте бутона за отваряне на Настройки (на компютър: Ctrl+Клик).',
            target: '€', // The value of the key to attach to
        },
        {
            id: 'tip-display-switch',
            text: 'Клик върху някой от дисплеите превключва активния дисплей (или натискане на бутона с две стрелки).',
            target: 'display', // A generic target for the display area
        },
        {
            id: 'tip-copy',
            text: 'Извлича от съдържанието на клипборда първото число (ако има такова).',
            target: '/', // A generic target for the display area
        },
        {
            id: 'tip-paste',
            text: 'Резултатът от пресмятанията се запомня автоматично в клипборда, така че можете лесно да го поставите навсякъде.',
            target: 'display', // A generic target for the display area
        }
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
        const savedStates = JSON.parse(localStorage.getItem('CXCalc_TipStates')) || {};
        tips = allTips.map(tip => ({
            ...tip,
            show: savedStates[tip.id] !== false // Default to true if not explicitly set to false
        }));
        console.log('Tips system initialized.');
    }

    /**
     * Saves the current 'show' state of all tips to localStorage.
     */
    function saveTipStates() {
        const statesToSave = tips.reduce((acc, tip) => {
            acc[tip.id] = tip.show;
            return acc;
        }, {});
        localStorage.setItem('CXCalc_TipStates', JSON.stringify(statesToSave));
    }

    /**
     * Creates and displays a single tip pop-up on the screen.
     * @param {object} tip The tip object to display.
     * @param {function} [onClose] Optional callback to execute when the tip is closed.
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
                <button class="tip-action-btn tip-dont-show-again-btn">Не показвай повече</button>
                <button class="tip-action-btn tip-close-btn">&times;</button>
            </div>
            <div class="tip-tail"></div>
        `;

        container.appendChild(tipElement);

        tipElement.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        const closeTip = (event) => {
            if (event) {
                event.stopPropagation();
            }
            document.removeEventListener('click', handleClickOutside, true);
            if (container.contains(tipElement)) {
                container.removeChild(tipElement);
            }
            if (onClose) {
                onClose();
            }
        };

        const handleClickOutside = (event) => {
            if (!tipElement.contains(event.target)) {
                closeTip(event);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', handleClickOutside, true);
        }, 0);

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


        // Event Listeners
        tipElement.querySelector('.tip-dont-show-again-btn').addEventListener('click', (event) => {
            const tipToUpdate = tips.find(t => t.id === tip.id);
            if (tipToUpdate) {
                tipToUpdate.show = false;
                saveTipStates();
            }
            closeTip(event);
        });

        tipElement.querySelector('.tip-close-btn').addEventListener('click', (event) => {
            closeTip(event);
        });
    }

    /**
     * Main function to control the display of tips.
     * @param {'Single' | 'All' | 'newOnly' | 'Reset'} mode The mode of operation.
     */
    function showTips(mode = 'Single') {
        document.querySelectorAll('.tip-popup').forEach(el => el.remove());

        switch (mode) {
            case 'Reset':
                tips.forEach(tip => tip.show = true);
                saveTipStates();
                showNotification('Всички подсказки са нулирани.', 'success');
                break;

            case 'All':
                let tipIndex = 0;
                const showNextTip = () => {
                    if (tipIndex < tips.length) {
                        const currentTip = tips[tipIndex];
                        tipIndex++;
                        createTipElement(currentTip, showNextTip);
                    } else {
                        showNotification('Приятна работа с CX-Calc!', 'success');
                    }
                };
                showNextTip();
                break;

            case 'newOnly':
                tips.filter(tip => tip.show).forEach(tip => createTipElement(tip));
                break;

            case 'Single':
            default:
                const firstTipToShow = tips.find(tip => tip.show);
                if (firstTipToShow) createTipElement(firstTipToShow);
                break;
        }
    }

