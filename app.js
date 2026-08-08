/* =========================================
   MantraVoice - app.js
   Voice Recognition + Automatic Japam Counter
   ========================================= */

"use strict";


/* =========================================
   ELEMENTS
   ========================================= */

const mantraInput =
    document.getElementById("mantra");

const targetInput =
    document.getElementById("target");

const targetDisplay =
    document.getElementById("targetDisplay");

const countDisplay =
    document.getElementById("count");

const progressBar =
    document.getElementById("progressBar");

const statusDisplay =
    document.getElementById("status");

const recognizedText =
    document.getElementById("recognizedText");

const startBtn =
    document.getElementById("startBtn");

const stopBtn =
    document.getElementById("stopBtn");

const completeCard =
    document.getElementById("completeCard");

const completeMessage =
    document.getElementById("completeMessage");


/* =========================================
   VARIABLES
   ========================================= */

let count = 0;

let target = 1100;

let recognition = null;

let isRunning = false;

let lastCountTime = 0;


/* =========================================
   GET TARGET
   ========================================= */

function getTarget() {

    let value =
        parseInt(targetInput.value, 10);

    if (!value || value < 1) {

        value = 1;

        targetInput.value = value;
    }

    return value;
}


/* =========================================
   SET TARGET
   ========================================= */

function setTarget(value) {

    target = Number(value);

    targetInput.value = target;

    targetDisplay.textContent = target;

    updateProgress();

    if (count > target) {

        count = target;

        updateCounter();
    }
}


/* =========================================
   TARGET INPUT CHANGE
   ========================================= */

targetInput.addEventListener(
    "input",
    function () {

        target = getTarget();

        targetDisplay.textContent =
            target;

        updateProgress();

        if (count > target) {

            count = target;

            updateCounter();
        }
    }
);


/* =========================================
   UPDATE COUNTER
   ========================================= */

function updateCounter() {

    countDisplay.textContent =
        count;

    targetDisplay.textContent =
        target;

    updateProgress();

    if (count >= target) {

        count = target;

        stopMantra();

        showComplete();

    }
}


/* =========================================
   UPDATE PROGRESS
   ========================================= */

function updateProgress() {

    if (!target || target <= 0) {

        progressBar.style.width =
            "0%";

        return;
    }

    let percentage =
        (count / target) * 100;

    percentage =
        Math.min(100, percentage);

    progressBar.style.width =
        percentage + "%";
}


/* =========================================
   NORMALIZE TEXT
   ========================================= */

function normalizeText(text) {

    if (!text) return "";

    return text
        .toLowerCase()
        .replace(/[.,!?;:।]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================
   MANTRA MATCH
   ========================================= */

function isMantraMatch(text) {

    const mantra =
        normalizeText(
            mantraInput.value
        );

    const spoken =
        normalizeText(text);

    if (!mantra || !spoken) {

        return false;
    }

    /*
       Exact match first
    */

    if (spoken === mantra) {

        return true;
    }


    /*
       Spoken text contains mantra
    */

    if (spoken.includes(mantra)) {

        return true;
    }


    /*
       Remove spaces for Telugu
       speech-recognition variations
    */

    const mantraCompact =
        mantra.replace(/\s/g, "");

    const spokenCompact =
        spoken.replace(/\s/g, "");

    if (
        mantraCompact &&
        spokenCompact.includes(mantraCompact)
    ) {

        return true;
    }


    return false;
}


/* =========================================
   COUNT MANTRA
   ========================================= */

function addJapam() {

    const now =
        Date.now();

    /*
       Prevent duplicate counting
       from the same recognition result
    */

    if (
        now - lastCountTime < 900
    ) {

        return;
    }

    if (count >= target) {

        return;
    }

    lastCountTime = now;

    count++;

    updateCounter();

    statusDisplay.textContent =
        "🙏 మంత్రం గుర్తించబడింది — జపం " +
        count;

}


/* =========================================
   SPEECH RECOGNITION
   ========================================= */

function createRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        return null;
    }

    const rec =
        new SpeechRecognition();

    /*
       Telugu language
    */

    rec.lang =
        "te-IN";

    rec.continuous =
        true;

    rec.interimResults =
        true;

    rec.maxAlternatives =
        3;


    /* ================================
       RESULT
       ================================= */

    rec.onresult =
        function (event) {

            let finalText = "";

            let interimText = "";


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result =
                    event.results[i];

                const text =
                    result[0].transcript;

                if (result.isFinal) {

                    finalText +=
                        text + " ";

                } else {

                    interimText +=
                        text + " ";
                }
            }


            const displayText =
                finalText ||
                interimText;


            if (displayText) {

                recognizedText.textContent =
                    displayText.trim();
            }


            /*
               Count only final
               speech results
            */

            if (finalText.trim()) {

                /*
                   Sometimes browser returns
                   multiple words in one result.
                   Check the complete mantra.
                */

                if (
                    isMantraMatch(
                        finalText
                    )
                ) {

                    addJapam();
                }

                /*
                   If exact mantra is not returned,
                   check each phrase separately.
                */

                else {

                    const parts =
                        finalText
                            .split(/[.!?,।]/)
                            .map(
                                x => x.trim()
                            )
                            .filter(Boolean);

                    for (
                        const part of parts
                    ) {

                        if (
                            isMantraMatch(part)
                        ) {

                            addJapam();

                            break;
                        }
                    }
                }
            }
        };


    /* ================================
       START
       ================================= */

    rec.onstart =
        function () {

            isRunning = true;

            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;

            statusDisplay.textContent =
                "🎤 వినిపిస్తోంది... మంత్రం పలకండి";

            recognizedText.textContent =
                "🎤 మీ మంత్రం వినడానికి సిద్ధంగా ఉంది...";
        };


    /* ================================
       ERROR
       ================================= */

    rec.onerror =
        function (event) {

            console.log(
                "Speech Recognition Error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                statusDisplay.textContent =
                    "🎤 Microphone permission ఇవ్వండి.";

                recognizedText.textContent =
                    "Browser Settings → Microphone → Allow";
            }

            else if (
                event.error ===
                "no-speech"
            ) {

                statusDisplay.textContent =
                    "🎤 మీ మంత్రం వినిపించలేదు... మళ్లీ పలకండి.";
            }

            else {

                statusDisplay.textContent =
                    "⚠️ Voice recognition error: " +
                    event.error;
            }
        };


    /* ================================
       END
       ================================= */

    rec.onend =
        function () {

            /*
               Mobile Chrome sometimes
               automatically stops recognition.
            */

            if (
                isRunning &&
                count < target
            ) {

                try {

                    rec.start();

                } catch (error) {

                    console.log(error);
                }

            }
            else {

                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;
            }
        };


    return rec;
}


/* =========================================
   START MANTRA
   ========================================= */

function startMantra() {

    if (count >= target) {

        count = 0;

        updateCounter();
    }


    /*
       Check browser support
    */

    if (
        !(
            window.SpeechRecognition ||
            window.webkitSpeechRecognition
        )
    ) {

        statusDisplay.textContent =
            "❌ ఈ browserలో Voice Recognition support లేదు.";

        recognizedText.textContent =
            "Chrome browser ఉపయోగించండి.";

        return;
    }


    /*
       Check mantra
    */

    if (
        !mantraInput.value.trim()
    ) {

        statusDisplay.textContent =
            "⚠️ ముందుగా మంత్రాన్ని నమోదు చేయండి.";

       
