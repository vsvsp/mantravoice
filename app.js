/* =========================================
   MantraVoice - Voice Japam Counter
   ========================================= */

let count = 0;
let target = 1100;
let recognition = null;
let isListening = false;


/* ==============================
   ELEMENTS
   ============================== */

const mantraInput = document.getElementById("mantra");
const targetInput = document.getElementById("target");

const countDisplay = document.getElementById("count");
const targetDisplay = document.getElementById("targetDisplay");

const progressBar = document.getElementById("progressBar");
const statusDisplay = document.getElementById("status");

const recognizedText = document.getElementById("recognizedText");

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

const completeCard = document.getElementById("completeCard");
const completeMessage = document.getElementById("completeMessage");


/* ==============================
   INITIAL SETUP
   ============================== */

document.addEventListener("DOMContentLoaded", function () {

    target = Number(targetInput.value) || 1100;

    updateDisplay();

    if (completeCard) {
        completeCard.style.display = "none";
    }

});


/* ==============================
   TARGET BUTTONS
   ============================== */

function setTarget(value) {

    target = Number(value);

    targetInput.value = target;

    count = 0;

    if (completeCard) {
        completeCard.style.display = "none";
    }

    updateDisplay();

    if (statusDisplay) {
        statusDisplay.textContent =
            "🎯 Target " + target + " ఎంచుకున్నారు";
    }

}


/* ==============================
   TARGET INPUT
   ============================== */

if (targetInput) {

    targetInput.addEventListener("input", function () {

        let value = Number(this.value);

        if (!value || value < 1) {
            value = 1;
        }

        target = value;

        updateDisplay();

    });

}


/* ==============================
   DISPLAY UPDATE
   ============================== */

function updateDisplay() {

    if (countDisplay) {
        countDisplay.textContent = count;
    }

    if (targetDisplay) {
        targetDisplay.textContent = target;
    }

    if (progressBar) {

        let percentage = 0;

        if (target > 0) {
            percentage = (count / target) * 100;
        }

        percentage = Math.min(percentage, 100);

        progressBar.style.width = percentage + "%";
    }

}


/* ==============================
   SPEECH RECOGNITION
   ============================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


function createRecognition() {

    if (!SpeechRecognition) {

        alert(
            "మీ Browserలో Voice Recognition support లేదు. Chrome Browser ఉపయోగించండి."
        );

        return null;
    }


    const rec = new SpeechRecognition();

    rec.lang = "te-IN";

    rec.continuous = true;

    rec.interimResults = true;

    rec.maxAlternatives = 1;


    /* ==========================
       RESULT
       ========================== */

    rec.onresult = function (event) {

        let finalText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const result = event.results[i];

            const text = result[0].transcript;

            if (result.isFinal) {

                finalText += text;

            }

        }


        if (finalText.trim() !== "") {

            recognizedText.textContent =
                "🗣️ " + finalText.trim();


            /*
             * Every confirmed voice phrase
             * = one Japam count
             */

            addCount();

        }

    };


    /* ==========================
       START
       ========================== */

    rec.onstart = function () {

        isListening = true;

        if (statusDisplay) {

            statusDisplay.textContent =
                "🎤 వింటోంది... మంత్రం పలకండి";

        }

        if (startBtn) {
            startBtn.disabled = true;
        }

        if (stopBtn) {
            stopBtn.disabled = false;
        }

    };


    /* ==========================
       END
       ========================== */

    rec.onend = function () {

        isListening = false;

        if (startBtn) {
            startBtn.disabled = false;
        }

        if (stopBtn) {
            stopBtn.disabled = true;
        }


        /*
         * Target complete అయితే restart చేయకూడదు
         */

        if (count >= target) {
            return;
        }


        /*
         * Browser recognition కొన్ని seconds
         * తర్వాత automatically stop చేస్తుంది.
         * అందుకే మళ్లీ start చేస్తాం.
         */

        if (recognition === rec) {

            try {

                rec.start();

            } catch (error) {

                console.log(
                    "Recognition restart:",
                    error
                );

            }

        }

    };


    /* ==========================
       ERROR
       ========================== */

    rec.onerror = function (event) {

        console.log(
            "Speech Recognition Error:",
            event.error
        );


        if (event.error === "not-allowed") {

            if (statusDisplay) {

                statusDisplay.textContent =
                    "⚠️ Microphone permission ఇవ్వండి";

            }

        }

        else if (event.error === "no-speech") {

            if (statusDisplay) {

                statusDisplay.textContent =
                    "🎤 వినిపించలేదు... మళ్లీ మంత్రం పలకండి";

            }

        }

        else {

            if (statusDisplay) {

                statusDisplay.textContent =
                    "⚠️ Voice recognition error: " +
                    event.error;

            }

        }

    };


    return rec;

}


/* ==============================
   ADD COUNT
   ============================== */

function addCount() {

    if (count >= target) {
        return;
    }

    count++;

    updateDisplay();


    if (count >= target) {

        count = target;

        updateDisplay();

        stopMantra();

        if (statusDisplay) {

            statusDisplay.textContent =
                "🙏 జపం పూర్తయింది!";

        }

        if (completeCard) {

            completeCard.style.display = "block";

        }

        if (completeMessage) {

            completeMessage.textContent =
                "మీరు " + target +
                " సార్లు జపం పూర్తి చేశారు. 🙏";

        }

    }

}


/* ==============================
   START MANTRA
   ============================== */

function startMantra() {

    if (count >= target) {

        count = 0;

        updateDisplay();

    }


    /*
     * Create recognition only when
     * user presses Start.
     * This triggers microphone permission.
     */

    if (!recognition) {

        recognition = createRecognition();

    }


    if (!recognition) {
        return;
    }


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Start error:",
            error
        );

    }

}


/* ==============================
   STOP MANTRA
   ============================== */

function stopMantra() {

    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(
                "Stop error:",
                error
            );

        }

    }

    isListening = false;


    if (startBtn) {
        startBtn.disabled = false;
    }

    if (stopBtn) {
        stopBtn.disabled = true;
    }


    if (statusDisplay) {

        statusDisplay.textContent =
            "⏹️ జపం ఆపబడింది";

    }

}


/* ==============================
   RESET
   ============================== */

function resetJapam() {

    stopMantra();

    count = 0;

    target =
        Number(targetInput.value) || 1100;

    updateDisplay();


    if (recognizedText) {

        recognizedText.textContent =
            "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";

    }


    if (completeCard) {

        completeCard.style.display =
            "none";

    }


    if (statusDisplay) {

        statusDisplay.textContent =
            "🎤 Start నొక్కి మంత్రం పలకండి";

    }

}


/* ==============================
   PAGE VISIBILITY
   ============================== */

document.addEventListener(
    "visibilitychange",
    function () {

        if (document.hidden && isListening) {

            console.log(
                "Page hidden"
            );

        }

    }
);
