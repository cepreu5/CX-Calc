
// Глобална променлива за следене на активното поле в Resto
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
            : (parseFloat(value.toString().replace(',', '.')) * (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583)).toFixed(2);
    } else {
        // BGN -> EUR (convertFromLevToEur)
        return typeof convertFromLevToEur === 'function'
            ? convertFromLevToEur(value.toString())
            : (parseFloat(value.toString().replace(',', '.')) / (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583)).toFixed(2);
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

    // Определяме водещата валута според активния елемент
    let useBgnAsMaster = false;
    if (document.activeElement) {
        const id = document.activeElement.id;
        if (id === 'due2' || id === 'paid2' || id === 'resto2') {
            useBgnAsMaster = true;
        }
    }

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
        // Смятаме в ЛЕВА
        const totalPaidBgn = paid2Val + (paid1Val * rate);
        baseBalance = due2Val - totalPaidBgn; // в BGN
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
        resto1.value = absEur > 0.005 ? absEur.toFixed(2) : '';
    }
    if (!isManualResto2) {
        const absBgn = Math.abs(displayBgn);
        resto2.value = absBgn > 0.005 ? absBgn.toFixed(2) : '';
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
                this.value = num.toFixed(2);
            }
        }
    });
});
