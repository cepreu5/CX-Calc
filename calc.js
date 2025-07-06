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
                console.log(`MainPoints[${key}]: x=${MainPoints[key].x}, y=${MainPoints[key].y}`);
                console.log(`MainPointsO[${key}]: x=${MainPointsO[key].x}, y=${MainPointsO[key].y}`);
            }
        }
    }

    function positionStatusArea(index) {
        const col = index - 1;
        const rect = calculator.getBoundingClientRect();
        const keyX = MainPoints.Keys.x + col * (MainPoints.KeySize.x + MainPoints.KbdGaps.x);
        const keyCenter = keyX + MainPoints.KeySize.x / 2;
        const status = document.getElementById(`statusArea${index}`);
        if (status) {
            status.className = "statusArea";
            status.style.position = "fixed";
            status.style.left = `${rect.left + MainPoints.Status.x + keyCenter - MainPoints.StatusSize.x / 2}px`;
            status.style.top = `${rect.top + MainPoints.Status.y}px`;
            status.style.width = `${MainPoints.StatusSize.x}px`;
            status.style.height = `${MainPoints.StatusSize.y}px`;
            status.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
        }
    }

    function noOverlay() {
        document.querySelectorAll('.overlay-marker').forEach(e => e.remove());
    };

    function placeKeys(keys, displayCoords, rect, scaleX, scaleY) {
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
            keyElement.style.height = `${MainPoints.KeySize.y}px`; //"5px";
            keyElement.style.backgroundColor = "transparent"; //"rgba(255,255,255,0.5)";
            keyElement.style.border = "1px solid #ddd";
            keyElement.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
            keyElement.style.zIndex = "9999";
            container.appendChild(keyElement);
        });
        // Дисплеи
        const markers = [
            { label: "Лев дисплей", coords: displayCoords.lv },
            { label: "Евро дисплей", coords: displayCoords.eur }
        ];
        markers.forEach(({ label, coords }) => {
            console.log("Дисплей на калкулатора.");
            const x = parseFloat(coords?.x);
            const y = parseFloat(coords?.y);
            if (isNaN(x) || isNaN(y)) {
                console.warn(`⚠️ ${label} получи невалидни координати:`, coords);
                return;
            }
            
            const marker = document.createElement("div");
            marker.className = "overlay-marker";
            marker.title = label;
            marker.style.position = "absolute";
            marker.style.left = `${x}px`;
            marker.style.top = `${y}px`;
            marker.style.width = `${MainPoints.DisplaySize.x}px`; // "5px";
            marker.style.height = `${MainPoints.DisplaySize.y}px`; // "5px";
            //marker.style.width = "5px";
            //marker.style.width = "5px";
            marker.style.backgroundColor = "transparent"; //"rgba(255,255,255,0.5)";
            marker.style.border = "1px solid #ddd";
            marker.style.pointerEvents = "none"; // за да не пречи на кликове по клавишите
            marker.style.zIndex = "9999";
            container.appendChild(marker);
        });
    }

    function calcNewCoordinates() {
        if (!calculator) {
            console.error("Липсва изображението на калкулатора.");
            return { keys: [], displayCoords: {} };
        }
        const rect = calculator.getBoundingClientRect();
        console.log("Координати на калкулатора L T:", rect.left, rect.top, MainPoints.Display.y);
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
            { label: "Лев дисплей", coords: displayCoords.lv },
            { label: "Евро дисплей", coords: displayCoords.eur }
        ];
        markers.forEach(({ label, coords }) => {
            console.log("Дисплей на калкулатора.");
            const x = parseFloat(coords?.x);
            const y = parseFloat(coords?.y);
            if (isNaN(x) || isNaN(y)) {
                console.warn(`⚠️ ${label} получи невалидни координати:`, coords);
                return;
            }
            
            var marker = document.getElementById("levInput");
            if (label == "Евро дисплей") {
                marker = document.getElementById("eurInput");
            }
            marker.className = "calculator-display";
            marker.title = label;
            marker.style.position = "absolute";
            marker.style.left = `${x}px`;
            marker.style.top = `${y - rect.top}px`;
            marker.style.width = `${MainPoints.DisplaySize.x}px`; // "5px";
            marker.style.height = `${MainPoints.DisplaySize.y}px`; // "5px";
        });

        /*display.style.top  = `${displayCoords.eur.y - rect.top}px`;
        displaylv.style.top = `${displayCoords.lv.y - rect.top}px`;
        display.style.left = displaylv.style.left = `${rect.left + MainPoints.Display.x}px`;
        display.style.width = displaylv.style.width = `${MainPoints.DisplaySize.x}px`;
        display.style.height = displaylv.style.height = `${MainPoints.DisplaySize.y}px`;*/
        for (let i = 1; i < 5; i++) positionStatusArea(i);
        //placeKeys(keys, displayCoords);
        return { keys, displayCoords };
    }
