// ================================
// MantraVoice - app.js
// ================================

let recognition = null;
let isListening = false;

let count = 0;
let target = 1100;

const mantraInput = document.getElementById("mantra");
const targetInput = document.getElementById("target");

const countEl = document.getElementById("count");
const targetDisplay = document.getElementById("targetDisplay");
const progressBar = document.getElementById("progressBar");

const statusEl = document.getElementById("status");
const recognizedText = document.getElementById("recognizedText");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");


// ================================
// PAGE LOAD
// ================================

document.addEventListener("DOMContentLoaded", () => {

    target = Number(targetInput.value) || 1100;

    updateDisplay();

    setupSpeechRecognition();

});


// ================================
// TARGET BUTTONS
// ================================

function setTarget(value) {

    target = Number(value);

    targetInput.value = target;
    targetDisplay.textContent = target;

    count = 0;

    updateDisplay();

    statusEl.textContent =
        "🎯 Target " + target + " ఎంచుకున్నారు. Start Japam నొక్కండి.";

}


// ================================
// TARGET INPUT CHANGE
// ================================

targetInput.addEventListener("input", () => {

    let value = Number(targetInput.value);

    if (!value || value < 1) {
        value = 1;
    }

    target = value;

    targetDisplay.textContent = target;

    if (count > target) {
        count = target;
    }

    updateDisplay();

});


// ================================
// SPEECH RECOGNITION
// ================================

function setupSpeechRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        statusEl.textContent =
            "❌ ఈ browserలో Voice Recognition support లేదు.";

        return;

    }

    recognition = new SpeechRecognition();

    recognition.lang = "te-IN";

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.maxAlternatives = 3;


    // ============================
    // RESULT
    // ============================

    recognition.onresult = function(event) {

        let finalText = "";

        let interimText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const text =
                event.results[i][0].transcript;

            if (event.results[i].isFinal) {

                finalText += text;

            } else {

                interimText += text;

            }

        }


        const displayText =
            finalText || interimText;

        if (displayText) {

            recognizedText.textContent =
                displayText;

        }


        // Final voice వచ్చినప్పుడు count
        if (finalText.trim()) {

            checkMantra(finalText);

        }

    };


    // ============================
    // START
    // ============================

    recognition.onstart = function() {

        isListening = true;

        startBtn.disabled = true;

        stopBtn.disabled = false;

        statusEl.textContent =
            "🎤 వింటున్నాను... మంత్రం పలకండి.";

    };


    // ============================
    // END
    // ============================

    recognition.onend = function() {

        isListening = false;

        startBtn.disabled = false;

        stopBtn.disabled = true;

        if (count < target) {

            statusEl.textContent =
                "🎤 Start నొక్కి మళ్లీ మంత్రం పలకండి.";

        }

    };


    // ============================
    // ERROR
    // ============================

    recognition.onerror = function(event) {

        console.log("Speech Error:", event.error);

        isListening = false;

        startBtn.disabled = false;

        stopBtn.disabled = true;


        if (event.error === "not-allowed") {

            statusEl.textContent =
                "🎤 Microphone permission Allow చేయండి.";

        }

        else if (event.error === "no-speech") {

            statusEl.textContent =
                "🎤 మీ స్వరం వినిపించలేదు. మళ్లీ ప్రయత్నించండి.";

        }

        else {

            statusEl.textContent =
                "❌ Microphone error: " + event.error;

        }

    };

}


// ================================
// CHECK MANTRA
// ================================

function checkMantra(text) {

    const enteredMantra =
        mantraInput.value.trim();

    if (!enteredMantra) {

        return;

    }


    const spoken =
        text.toLowerCase().trim();


    // మొత్తం textలో మంత్రంలోని పదాలు
    const words =
        enteredMantra
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 1);


    let matched = 0;


    words.forEach(word => {

        if (spoken.includes(word)) {

            matched++;

        }

    });


    // మంత్రం match అయితే count +1
    if (matched >= Math.max(1, Math.ceil(words.length * 0.5))) {

        addCount();

    }

}


// ================================
// ADD COUNT
// ================================

function addCount() {

    if (count >= target) {

        return;

    }


    count++;

    updateDisplay();


    statusEl.textContent =
        "🙏 మంత్రం గుర్తించబడింది — " +
        count +
        " / " +
        target;


    if (count >= target) {

        completeJapam();

    }

}


// ================================
// DISPLAY
// ================================

function updateDisplay() {

    countEl.textContent = count;

    targetDisplay.textContent = target;

    const percentage =
        Math.min(
            100,
            (count / target) * 100
        );


    progressBar.style.width =
        percentage + "%";

}


// ================================
// START JAPAM
// ================================

function startMantra() {

    if (!recognition) {

        setupSpeechRecognition();

    }


    if (!recognition) {

        return;

    }


    if (isListening) {

        return;

    }


    // Browser microphone permission
    try {

        recognition.start();

    }

    catch (error) {

        console.log(error);

    }

}


// ================================
// STOP JAPAM
// ================================

function stopMantra() {

    if (recognition && isListening) {

        recognition.stop();

    }


    isListening = false;

    startBtn.disabled = false;

    stopBtn.disabled = true;


    statusEl.textContent =
        "⏹ జపం ఆపబడింది.";

}


// ================================
// COMPLETE
// ================================

function completeJapam() {

    if (recognition && isListening) {

        recognition.stop();

    }


    statusEl.textContent =
        "🎉 మీ జపం పూర్తయింది! 🙏";


    const completeCard =
        document.getElementById("completeCard");

    const completeMessage =
        document.getElementById("completeMessage");


    if (completeCard) {

        completeCard.style.display = "block";

    }


    if (completeMessage) {

        completeMessage.textContent =
            "మీరు " +
            target +
            " సార్లు మంత్ర జపం పూర్తి చేశారు. 🙏";

    }

}


// ================================
// RESET
// ================================

function resetJapam() {

    if (recognition && isListening) {

        recognition.stop();

    }


    count = 0;

    updateDisplay();


    const completeCard =
        document.getElementById("completeCard");

    if (completeCard) {

        completeCard.style.display = "none";

    }


    statusEl.textContent =
        "🎤 Start నొక్కి మంత్రం పలకండి.";


    recognizedText.textContent =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";

}


// ================================
// MAKE FUNCTIONS GLOBAL
// ================================

window.setTarget = setTarget;

window.startMantra = startMantra;

window.stopMantra = stopMantra;

window.resetJapam = resetJapam;
