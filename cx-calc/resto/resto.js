// Функция за закръгляне до 2 знакa
function roundToTwo(num) {
    return Math.round((num + Number.EPSILON) * 100) / 100;
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
    resto1.classList.remove('resto-positive', 'resto-negative');
    resto2.classList.remove('resto-positive', 'resto-negative');

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
        // Дясното поле си взема цвета
        if (remainingEur > epsilon) {
            resto2.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto2.classList.add('resto-negative');
        }

    } else if (mode === 'manual_right') {
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
