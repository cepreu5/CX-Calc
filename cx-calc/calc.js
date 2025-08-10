// calc.js ----------------------

let MainPoints = {};
let MainPointsO = {};

export function setMainPoints(points, pointsO) {
    MainPoints = points;
    MainPointsO = pointsO;
}

export function scaleMainPoints(aspectRatioW, aspectRatioH) {
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
        }
    }
}

function positionStatusArea(index, ovFlag = false, calculator, container) {
    const col = index - 1;
    const rect = calculator.getBoundingClientRect();
    const keyX = MainPoints.Keys.x + col * (MainPoints.KeySize.x + MainPoints.KbdGaps.x);
    const keyCenter = keyX + MainPoints.KeySize.x / 2;
    const status = document.getElementById(`statusArea${index}`);
    if (status && !ovFlag) {
        status.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
        status.style.top = `${rect.top + MainPoints.Status.y}px`;
        status.style.width = `${MainPoints.StatusSize.x}px`;
        status.style.height = `${MainPoints.StatusSize.y}px`;
    }
    if (ovFlag) {
        const marker = document.createElement("div");
        marker.className = "overlay-marker";
        marker.style.position = "fixed";
        marker.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
        marker.style.top = `${rect.top + MainPoints.Status.y}px`;
        marker.style.width = `${2 + MainPoints.StatusSize.x}px`;
        marker.style.height = `${2 + MainPoints.StatusSize.y}px`;
        marker.style.pointerEvents = "none";
        marker.style.backgroundColor = "transparent";
        marker.style.border = "5px solid yellow";
        marker.style.zIndex = "9999";
        container.appendChild(marker);
    }
}

export function noOverlay() {
    document.querySelectorAll('.overlay-marker').forEach(e => e.remove());
};

export function placeKeys(keys, displayCoords) {
    const container = document.body;
    noOverlay();
    keys.forEach(key => {
        const keyElement = document.createElement("div");
        keyElement.className = "overlay-marker";
        keyElement.style.position = "fixed";
        keyElement.style.left = `${key.x}px`;
        keyElement.style.top = `${key.y}px`;
        keyElement.style.width = `${MainPoints.KeySize.x}px`;
        keyElement.style.height = `${MainPoints.KeySize.y}px`;
        keyElement.style.backgroundColor = "transparent";
        keyElement.style.border = "1px solid yellow";
        keyElement.style.pointerEvents = "none";
        keyElement.style.zIndex = "9999";
        container.appendChild(keyElement);
    });
    for (let i = 1; i < 5; i++) positionStatusArea(i, true, document.querySelector(".calculator-img"), container);
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

export function calcNewCoordinates(calculator) {
    if (!calculator) {
        console.error("Липсва изображението на калкулатора.");
        return { keys: [], displayCoords: {} };
    }
    const rect = calculator.getBoundingClientRect();
    const containerRect = document.getElementById('calculatorContainer').getBoundingClientRect();
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
    const keys = [];
    const rows = 5;
    const cols = 4;
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
        { label: "Лев дисплей", id: "levInput", coords: displayCoords.lv },
        { label: "Евро дисплей", id: "eurInput", coords: displayCoords.eur },
        { label: "Валута", id: "currency", coords: { x: displayCoords.eur.x + MainPoints.CurrencyOffset.x, y: displayCoords.eur.y + MainPoints.CurrencyOffset.y } },
        { label: "Валута Лев", id: "currencyLev", coords: { x: displayCoords.lv.x + MainPoints.CurrencyLevOffset.x, y: displayCoords.lv.y + MainPoints.CurrencyLevOffset.y } }
    ];
    markers.forEach(({ label, id, coords }) => {
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
            marker.className = "calculator-display";
            marker.style.width = `${MainPoints.DisplaySize.x}px`;
            marker.style.height = `${MainPoints.DisplaySize.y}px`;
        } else if (id === "currency" || id === "currencyLev") {
            const baseFontSize = 24;
            const aspectRatioH = calculator.clientHeight / calculator.naturalHeight;
            marker.style.fontSize = `${baseFontSize * aspectRatioH}px`;
        }
    });
    for (let i = 1; i < 5; i++) positionStatusArea(i, false, calculator, document.body);
    return { keys, displayCoords };
}
