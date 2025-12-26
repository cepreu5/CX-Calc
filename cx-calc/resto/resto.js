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

const restoMainLabel = document.getElementById('resto-main-label');
const restoSplitLabels = document.getElementById('resto-split-labels');
const restoLabelLeft = document.getElementById('resto-label-left');
const restoLabelRight = document.getElementById('resto-label-right');

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
function clearField(fieldId) {
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
    // 1. Вземаме базата (закръглена от calculateTotalResto)
    const totalRestoEurBase = calculateTotalResto();
    // totalRestoEurBase > 0 -> Дължим още. < 0 -> Има ресто за връщане.

    // 2. Вземаме въведеното в Resto полетата (ако са manual)
    // Ако поле не е manual, приемаме че е 0 за целите на сметката?
    // Или по-скоро:
    // Ако и двете са manual -> Сумираме ги и показваме остатъка... къде?
    // Ако едното е manual -> Другото поема остатъка.

    let val1 = 0; // EUR
    let val2 = 0; // BGN -> EUR

    if (isManualResto1) {
        val1 = parseFloat(resto1.value.replace(',', '.')) || 0;
        // val1 е в EUR, няма нужда от конвертиране, но е добре да е число
    }
    if (isManualResto2) {
        let v = parseFloat(resto2.value.replace(',', '.')) || 0;
        // v e BGN. Конвертираме и закръгляме до 2-рия знак преди вадене
        val2 = roundToTwo(v / (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583));
    }

    let remainingEur;

    // Логика:
    // Ако сме в режим "Дължимо" (base > 0): Потребителят въвежда колко ПЛАЩА допълнително.
    // Remaining = Base - (Val1 + Val2).

    // Ако сме в режим "Ресто" (base < 0): Потребителят въвежда колко ВРЪЩА.
    // Base е -50 (трябва да върнем 50).
    // Val1 = 10 (върнахме 10).
    // Remaining = Base + (Val1 + Val2). ( -50 + 10 = -40).

    if (totalRestoEurBase >= 0) {
        // Дължимо
        remainingEur = roundToTwo(totalRestoEurBase - (val1 + val2));
    } else {
        // Ресто (negative base)
        remainingEur = roundToTwo(totalRestoEurBase + (val1 + val2));
    }

    // 3. Обновяване на NON-manual полетата
    // Ако и двете са manual -> нищо не се обновява като стойност, само визуализация.
    // Ако само едното е manual -> другото поема remainer.

    if (isManualResto1 && !isManualResto2) {
        // Resto2 е автоматично
        // То трябва да покаже remaining в BGN
        // Но Wait, ако remaining е с обратен знак?
        // Ако трябва да върна 50 (base=-50). Върнал съм 10 (val1=10). Rem=-40.
        // Resto2 трябва да покаже 40 BGN.
        const remBgn = roundToTwo(Math.abs(remainingEur) * (typeof EXCHANGE_RATE !== 'undefined' ? EXCHANGE_RATE : 1.95583));
        resto2.value = remBgn > 0.005 ? remBgn.toFixed(2) : '';
        updateRestoVisuals(remainingEur, 'manual_left');
    }
    else if (!isManualResto1 && isManualResto2) {
        // Resto1 е автоматично
        const remEur = Math.abs(remainingEur); // вече е закръглено
        resto1.value = remEur > 0.005 ? remEur.toFixed(2) : '';
        updateRestoVisuals(remainingEur, 'manual_right');
    }
    else if (isManualResto1 && isManualResto2) {
        // И двете са manual.
        // Показваме статус според remaining.
        // Какъв режим визуален? Split с 'Върнати' и на двете?
        // Потребителят искаше "над другото поле да се показва Върнати".
        // Ако и двете са Върнати... Етикетите?
        // Може би трябва трети режим 'manual_both'?
        // Засега да не усложняваме излишно visual функцията, ползваме manual_left (Resto1=Върнати, Resto2=Status).
        // Но Resto2 е manual! Значи Resto2 е Върнати.
        updateRestoVisuals(remainingEur, 'manual_both');
    }
    else {
        // Нито едно не е manual -> Автоматичен режим (Default)
        // Resto1 поема всичко (EUR), Resto2 е конвертирано.
        // Това се случва при reset или initial.
        const displayResto1 = Math.abs(totalRestoEurBase);
        resto1.value = displayResto1 > 0.005 ? displayResto1.toFixed(2) : '';

        const r2 = conveert(displayResto1 > 0.005 ? displayResto1.toFixed(2) : 0, 'eurToBgn');
        resto2.value = r2;

        updateRestoVisuals(totalRestoEurBase, 'default');
    }
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

// Помощна функция за обновяване на цветовете и етикета
// Помощна функция за обновяване на цветовете и етикета
// mode: 'default' | 'manual_left' | 'manual_right'
function updateRestoVisuals(remainingEur, mode) {
    // 1. Нулиране на класове
    resto1.classList.remove('resto-positive', 'resto-negative');
    resto2.classList.remove('resto-positive', 'resto-negative');

    const epsilon = 0.005;
    let statusLabel = ''; // "Ресто" или "Дължимо"

    // Определяне на правилния етикет според остатъка
    if (remainingEur > epsilon) {
        statusLabel = 'Дължимо';
    } else {
        statusLabel = 'Ресто';
    }

    // 2. Логика според режима
    if (mode === 'default') {
        // Скриваме split, показваме main
        restoSplitLabels.classList.remove('visible');
        // Връщаме main label
        restoMainLabel.style.display = 'block';
        restoMainLabel.textContent = statusLabel;

        // Цветове - и двете полета
        if (remainingEur > epsilon) {
            resto1.classList.add('resto-positive');
            resto2.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto1.classList.add('resto-negative');
            resto2.classList.add('resto-negative');
        }

    } else if (mode === 'manual_left') {
        // Показваме split, скриваме main
        restoMainLabel.style.display = 'none';
        restoSplitLabels.classList.add('visible');

        // Левият етикет е Върнати, Десният е статусът
        restoLabelLeft.textContent = 'Върнати';
        restoLabelRight.textContent = statusLabel;

        // Лявото поле е бяло (стандартно - вече махнахме класовете)
        // Дясното поле си взема цвета
        if (remainingEur > epsilon) {
            resto2.classList.add('resto-positive');
        } else if (remainingEur < -epsilon) {
            resto2.classList.add('resto-negative');
        }

    } else if (mode === 'manual_right') {
        // Показваме split, скриваме main
        restoMainLabel.style.display = 'none';
        restoSplitLabels.classList.add('visible');

        // Левият е статусът, Десният е Върнати
        restoLabelLeft.textContent = statusLabel;
        restoLabelRight.textContent = 'Върнати';

        // Дясното поле е бяло
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
