
// Глобална променлива за следене на активното поле в Resto
let activeRestoField = null;

// Функция, която се вика от mainAll.js при натискане на клавиш от калкулатора
// Връща true, ако е обработила входа (т.е. има активно поле), и false иначе.
function handleCalculatorInputForResto(key) {
    // console.log("handleRestoInput called with:", key, "ActiveField:", activeRestoField);

    // Backup: ако activeRestoField е изгубен, но имаме елемент с клас active-virtual-focus, го възстановяваме.
    if (!activeRestoField) {
        const virtualActive = document.querySelector('.panel input.active-virtual-focus');
        if (virtualActive) {
            activeRestoField = virtualActive;
        }
    }

    if (!activeRestoField) return false;

    // Игнорираме някои специални клавиши, които може да нямат смисъл тук
    // или ги обработваме специфично.

    // Ако е "C" (Clear) -> изтриваме съдържанието на ВСИЧКИ полета в панела
    if (key === 'C') {
        document.querySelectorAll('.panel input[type="text"]').forEach(input => {
            input.value = '';
            triggerInputEvent(input);
        });
        return true;
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

    return false; // Клавишът не е за нас (напр. +, -, =, L и т.н.)
}

// Помощна функция за ръчно тригиране на input event,
// за да се задействат всичките validate и calculate логики.
function triggerInputEvent(field) {
    field.dispatchEvent(new Event('input', { bubbles: true }));
}


// Закачаме focus/blur listeners, за да знаем кое е активното поле
document.querySelectorAll('.panel input[type="text"]').forEach(input => {
    // Когато полето получи фокус, го правим активно
    input.addEventListener('focus', function (e) {
        // Преди да направим това поле активно, трябва да "затворим" предишното активно поле,
        // ако има такова. Това е важно при директно превключване между полетата (input1 -> input2).
        document.querySelectorAll('.panel input').forEach(otherInput => {
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

    // При blur махаме активния статус, ако фокусът не е отишъл в друго поле от нашите
    // Всъщност blur се случва преди focus на другия елемент...
    // Можем да го нулираме с малко закъснение, което другият focus ще отмени?
    // Или просто при focus на друго го презаписваме. 
    // Риск: Ако кликнем на бутон от калкулатора, input губи фокус -> activeRestoField става null -> handleCalculatorInputForResto не работи.

    // РЕШЕНИЕ:
    // Не трябва да махаме activeRestoField при blur веднага, защото кликът върху бутона на калкулатора
    // първо предизвиква blur на input-a.
    // Трябва ни механизъм "ако фокусът отиде извън панела И не е върху калкулатора...".
    // Но бутоните на калкулатора не са фокусъбъл елементи (обикновено са div/img map).

    // Така или иначе, ако потребителят кликне "настрани", полето губи фокус визуално.
    // Ако искаме да ползваме калкулаторните бутони, потребителят *гледа* в полето.

    // Нека пробваме без зачистване при blur първоначално - "Последното активно поле".
    // Или по-добре: При клик върху калкулатора (който се хваща от mainAll.js),
    // ние *знаем*, че искаме да пишем в полето, ако то е било последно активно.

    // Нека добавим визуална индикация (клас) за "активно за писане чрез калкулатор".
});

// Добавяме глобален listener за кликове извън панела, за да деактивираме полето,
// АКО кликът не е върху калкулатора.
// Добавяме глобален listener за кликове извън панела, за да деактивираме полето,
// АКО кликът не е върху калкулатора.
// Добавяме глобален listener за кликове извън панела, за да деактивираме полето,
// АКО кликът не е върху калкулатора или панела.
document.addEventListener('click', function (e) {
    // Проверяваме дали кликът е вътре в .calculator-container (който съдържа и панела, и калкулатора)
    const isInsideContainer = e.target.closest('.calculator-container');

    // Ако кликът е ИЗВЪН контейнера, тогава деактивираме полето.
    // (Това позволява кликове върху .ctoverlay, .calculator-img и самия .panel да запазват фокуса)
    if (!isInsideContainer && !e.target.classList.contains('ctoverlay') && e.target.id !== 'ctoverlay') {
        if (activeRestoField) {
            // Премахваме класа ПРЕДИ да извикаме blur, за да може resto.js да изпълни форматирането
            activeRestoField.classList.remove('active-virtual-focus');
            activeRestoField.dispatchEvent(new Event('blur'));
        }

        activeRestoField = null;
        // Махаме visual active state от всички
        document.querySelectorAll('.panel input').forEach(i => i.classList.remove('active-virtual-focus'));
    }
});



// Трябва да изнесем handle function глобално, за да я вика mainAll.js
window.handleRestoInput = handleCalculatorInputForResto;
