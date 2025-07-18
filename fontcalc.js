    function getTextWidth(text, inputElement) {
        const span = document.createElement("span");
        span.style.visibility = "hidden";
        span.style.position = "absolute";
        span.style.whiteSpace = "pre"; // запазва интервалите
        span.style.fontSize = getComputedStyle(inputElement).fontSize;
        span.style.fontFamily = getComputedStyle(inputElement).fontFamily;
        span.style.fontWeight = getComputedStyle(inputElement).fontWeight;
        span.textContent = text;
        document.body.appendChild(span);
        const width = span.offsetWidth;
        document.body.removeChild(span);
        return width;
    }

    function adjustFontSize(element1, element2) {
        const maxFontSize = 48;
        const minFontSize = 14;
        // Вземаме текстовете
        const text1 = element1.innerText !== undefined ? element1.innerText : element1.textContent || "0";
        const text2 = element2.innerText !== undefined ? element2.innerText : element2.textContent || "0";
        console.log("text1: " + text1);
        console.log("text2: " + text2);
        // Избираме по-дългия текст (по брой символи)
        const longerText = text1.length >= text2.length ? text1 : text2;
        // Използваме ширината и височината на по-малкия елемент (за по-сигурно)
        const width = Math.min(element1.clientWidth, element2.clientWidth);
        const height = Math.min(element1.clientHeight, element2.clientHeight);
        // Създаваме скрит div за измерване
        const measuringDiv = document.createElement("div");
        measuringDiv.style.position = "absolute";
        measuringDiv.style.visibility = "hidden";
        measuringDiv.style.height = "auto";
        measuringDiv.style.width = width + "px";
        measuringDiv.style.whiteSpace = "pre";
        const cs = getComputedStyle(element1);
        measuringDiv.style.fontFamily = cs.fontFamily;
        measuringDiv.style.fontWeight = cs.fontWeight;
        measuringDiv.style.letterSpacing = cs.letterSpacing;
        // Без padding/border, за да мерим само съдържанието
        measuringDiv.style.padding = "0";
        measuringDiv.style.border = "none";
        measuringDiv.style.boxSizing = "border-box";
        document.body.appendChild(measuringDiv);
        let fontSize = maxFontSize;
        while (fontSize >= minFontSize) {
            measuringDiv.style.fontSize = fontSize + "px";
            measuringDiv.textContent = longerText;
            if (measuringDiv.scrollWidth <= width && measuringDiv.scrollHeight <= height) {
                break;
            }
            fontSize--;
        }
        if (fontSize < minFontSize) fontSize = minFontSize;
        // Прилагаме еднакъв размер и на двата елемента
        element1.style.fontSize = fontSize + "px";
        element2.style.fontSize = fontSize + "px";
        document.body.removeChild(measuringDiv);
    }

    function resizeFont() {return;
        const height = display.clientHeight; // Взимаме височината на дисплея
        display.style.fontSize = displaylv.style.fontSize = (height * 0.99) + 'px'; // 8% от височината
    }
