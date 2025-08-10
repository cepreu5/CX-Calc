// history.js -----------------------

let history = []; // масив от { entry: string, session: number }
const MAX_HISTORY_ITEMS = 30;

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

function formatNumber(num) {
    if (isNaN(num)) return '';
    return num.toFixed(2).replace('.', ',');
}

export function loadHistory() {
    const savedHistory = JSON.parse(localStorage.getItem('CXCalc_history'));
    // Филтрираме старите записи, които може да нямат 'operation' или 'result'
    history = savedHistory ? savedHistory.filter(record => record.operation && record.result) : [];
}

function saveHistoryToStorage() {
    localStorage.setItem('CXCalc_history', JSON.stringify(history));
}

export function addHistoryEntry(operation, levValue, eurValue) {
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

export function updateHistoryList() {
    const historyList = document.getElementById('historyList');
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

export function handleClearHistory() {
    history = [];
    saveHistoryToStorage();
    updateHistoryList();
    document.getElementById('closeHistoryModalButton').click();
}

export function historyOpen() {
    // This function depends on noOverlay from the main module.
    // It will be handled during the refactoring of the main module.
    // For now, we'll assume it exists globally.
    if (typeof noOverlay === 'function') {
        noOverlay();
    }
    updateHistoryList();
    document.getElementById('historyModal').style.display = 'flex';
    // This depends on modalIsActive from the main module.
    // It will be handled during the refactoring of the main module.
    window.modalIsActive = true;
};
