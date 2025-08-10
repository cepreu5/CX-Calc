// ------------ status.js

// This module will depend on the main module for the `Mem` array and other state.
// For now, we will assume they are passed in or exist globally.
let Mem = [0, 0, 0, 0];

export function setMem(newMem) {
    Mem = newMem;
}

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
export function isMemoryKey(value) {
    return /^[1-9]$/.test(value) || ["*", "/", "-"].includes(value);
}

export function memoryAdd(targetSlot, operation = "+", displayValue) {
    let value = parseFloat(displayValue);
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
export function executeMemoryAction(value, statusArea, displayValue) {
    switch (statusArea) {
        case 1:
        switch (value) {
            case "1": memoryAdd(1, "+", displayValue); break;
            case "4": memoryAdd(1, "-", displayValue); break;
            case "7": memoryAdd(1, "0", displayValue); clearStatus(statusArea); break;
        }
        break;
        case 2:
        switch (value) {
            case "2": memoryAdd(2, "+", displayValue); break;
            case "5": memoryAdd(2, "-", displayValue); break;
            case "8": memoryAdd(2, "0", displayValue); clearStatus(statusArea); break;
        }
        break;
        case 3:
        switch (value) {
            case "3": memoryAdd(3, "+", displayValue); break;
            case "6": memoryAdd(3, "-", displayValue); break;
            case "9": memoryAdd(3, "0", displayValue); clearStatus(statusArea); break;
        }
        break;
    }
}

//memoryShow: Временно показва стойността от даден слот на паметта в горния дисплей, без да го променя
export function memoryShow(slot) {
    if (slot == 4) {
        const calculatorEl = document.getElementById("calculator");
        const newSkin = calculatorEl.src.includes("CalculatorA.png") ? "Calculator0.png" : "CalculatorA.png";
        calculatorEl.src = newSkin;

        // Запазваме новия скин в localStorage
        const settings = JSON.parse(localStorage.getItem('appSettings')) || {};
        settings.calculatorSkin = newSkin; // Запазваме името на файла
        localStorage.setItem('appSettings', JSON.stringify(settings));
        return;
    }
    if (Mem[slot] === undefined) {
        console.warn(`Памет Mem[${slot}] е недефинирана.`);
        return;
    }
    const displaylv = document.getElementById('levInput');
    const display = document.getElementById('eurInput');
    const originalValue = displaylv.textContent; // Запазваме оригиналната стойност на levInput
    const originalEurValue = display.textContent; // Запазваме оригиналната стойност на eurInput (div)
    const originalBgColor = displaylv.style.backgroundColor;
    const originalEurBgColor = display.style.backgroundColor; // Запазваме оригиналния фон на eurInput (div)
    // Форматираме и показваме стойността от паметта
    const memValueStr = (Mem[slot]).toFixed(2).replace('.',','); // Simplified formatting
    // Показваме стойността в eurInput (div)
    display.textContent = memValueStr;
    // adjustFontSize(displaylv, display); // This function is in another module
    display.style.backgroundColor = 'rgba(255, 223, 186, 0.5)'; // Светло оранжево за индикация
    // Връщаме оригиналните стойности след 3 секунди
    setTimeout(() => {
        display.textContent = originalEurValue;
        display.style.backgroundColor = originalEurBgColor;
    }, 1000);
}

export function memoryRecall(slot) {
    // This function has many dependencies on the main state (userInput, levMode, displays)
    // It will be refactored to accept the state it needs.
    if (Mem[slot] === undefined || Mem[slot] === 0) {
        return "";
    }
    const valueStr = Mem[slot].toString().replace('.', ',');
    return valueStr;
}

export function clearStatus(sArea) {
    const statusId = typeof sArea === "number" ? `statusArea${sArea}` : sArea;
    const status = document.getElementById(statusId);
    if (!status) return;
    status.style.opacity = "0";
}

export function clearAllMemory() {
    for (let i = 1; i < 4; i++) {
        Mem[i] = 0;
        clearStatus(i);
    }
    localStorage.setItem('CXCalc_CalcMem', JSON.stringify(Mem));
}
