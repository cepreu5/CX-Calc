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
            status.className = "statusArea";
            status.style.position = "fixed";
            status.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
            status.style.top = `${rect.top + MainPoints.Status.y}px`;
            status.style.width = `${MainPoints.StatusSize.x}px`;
            status.style.height = `${MainPoints.StatusSize.y}px`;
            status.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
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
            keyElement.style.position = "absolute";
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
            { label: "Лев дисплей",  id: "levInput",  coords: displayCoords.lv },
            { label: "Евро дисплей", id: "eurInput",  coords: displayCoords.eur },
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
            // Прилагаме размер и клас само на дисплеите, не и на символа за валута
            if (id === "levInput" || id === "eurInput") {
                marker.className = "calculator-display";
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
