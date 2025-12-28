
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

    if (!activeRestoField) return false;

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
