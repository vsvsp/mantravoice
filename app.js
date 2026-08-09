/* =========================================
   MantraVoice
   STRICT VOICE MANTRA COUNTER
   ========================================= */

"use strict";


/* =========================================
   VARIABLES
   ========================================= */

let count = 0;

let target = 1100;

let recognition = null;

let isListening = false;

let lastCountTime = 0;

let starting = false;


/* =========================================
   ELEMENTS
   ========================================= */

const mantraInput =
    document.getElementById("mantra");

const targetInput =
    document.getElementById("target");

const countDisplay =
    document.getElementById("count");

const targetDisplay =
    document.getElementById("targetDisplay");

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
   NORMALIZE
   ========================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================
   GET MANTRA WORDS
   ========================================= */

function getMantraWords() {

    return normalizeText(
        mantraInput.value
    )
    .split(" ")
    .filter(function(word) {

        return word.length >= 2;

    });

}


/* =========================================
   STRICT MANTRA MATCH
   ========================================= */

function isMantraMatch(spokenText) {

    const mantra =
        normalizeText(
            mantraInput.value
        );

    const spoken =
        normalizeText(
            spokenText
        );


    if (!mantra || !spoken) {

        return false;

    }


    /*
     * Exact match
     */

    if (mantra === spoken) {

        return true;

    }


    /*
     * Compact Telugu comparison
     */

    const mantraCompact =
        mantra.replace(/\s/g, "");

    const spokenCompact =
        spoken.replace(/\s/g, "");


    if (
        mantraCompact.length >= 8 &&
        spokenCompact === mantraCompact
    ) {

        return true;

    }


    /*
     * Word matching
     */

    const mantraWords =
        getMantraWords();


    const spokenWords =
        spoken.split(" ")
        .filter(function(word) {

            return word.length >= 2;

        });


    if (
        mantraWords.length === 0 ||
        spokenWords.length === 0
    ) {

        return false;

    }


    let matchedWords = 0;


    mantraWords.forEach(
        function(mantraWord) {

            let found = false;


            spokenWords.forEach(
                function(spokenWord) {

                    if (
                        spokenWord ===
                        mantraWord
                    ) {

                        found = true;

                    }

                }
            );


            if (found) {

                matchedWords++;

            }

        }
    );


    /*
     * IMPORTANT:
     *
     * For 4-word mantra:
     * 4/4 required.
     *
     * For 3-word mantra:
     * 3/3 required.
     *
     * For 2-word mantra:
     * 2/2 required.
     *
     * This prevents random speech
     * from increasing the count.
     */

    return (
        matchedWords ===
        mantraWords.length
    );

}


/* =========================================
   UPDATE DISPLAY
   ========================================= */

function updateDisplay() {

    countDisplay.textContent =
        count;

    targetDisplay.textContent =
        target;


    let percentage = 0;


    if (target > 0) {

        percentage =
            (count / target) * 100;

    }


    percentage =
        Math.min(
            100,
            percentage
        );


    progressBar.style.width =
        percentage + "%";

}


/* =========================================
   SET TARGET
   ========================================= */

function setTarget(value) {

    stopMantra();


    target =
        Number(value) || 1;


    targetInput.value =
        target;


    count = 0;

    lastCountTime = 0;


    completeCard.style.display =
        "none";


    updateDisplay();


    statusDisplay.textContent =
        "🎯 Target " +
        target +
        " ఎంచుకున్నారు";

}


/* =========================================
   TARGET INPUT
   ========================================= */

targetInput.addEventListener(
    "change",
    function() {

        target =
            parseInt(
                targetInput.value,
                10
            ) || 1;


        if (target < 1) {

            target = 1;

        }


        targetInput.value =
            target;


        if (count > target) {

            count = target;

        }


        updateDisplay();

    }
);


/* =========================================
   ADD COUNT
   ========================================= */

function addCount() {

    if (count >= target) {

        return;

    }


    const now =
        Date.now();


    /*
     * Duplicate protection.
     *
     * Same mantra result cannot
     * count again immediately.
     */

    if (
        now - lastCountTime <
        1500
    ) {

        return;

    }


    lastCountTime =
        now;


    count++;


    updateDisplay();


    statusDisplay.textContent =
        "🙏 మంత్రం గుర్తించబడింది — " +
        count +
        " / " +
        target;


    if (
        navigator.vibrate
    ) {

        navigator.vibrate(50);

    }


    if (
        count >= target
    ) {

        completeJapam();

    }

}


/* =========================================
   SPEECH RECOGNITION
   ========================================= */

function createRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        statusDisplay.textContent =
            "❌ ఈ browserలో Voice Recognition లేదు. Chrome ఉపయోగించండి.";

        return null;

    }


    const rec =
        new SpeechRecognition();


    rec.lang =
        "te-IN";


    /*
     * Important:
     * One recognition session at a time.
     */

    rec.continuous =
        false;


    rec.interimResults =
        false;


    rec.maxAlternatives =
        1;


    /* =====================================
       START
       ===================================== */

    rec.onstart =
        function() {

            isListening =
                true;

            starting =
                false;


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 ఇప్పుడు మంత్రం పలకండి";


            recognizedText.textContent =
                "🎤 మీ మంత్రం కోసం వేచి ఉంది...";

        };


    /* =====================================
       RESULT
       ===================================== */

    rec.onresult =
        function(event) {

            if (!event.results) {

                return;

            }


            const result =
                event.results[
                    event.results.length - 1
                ];


            if (!result) {

                return;

            }


            const spoken =
                result[0]
                    .transcript
                    .trim();


            if (!spoken) {

                return;

            }


            /*
             * Show what browser heard.
             */

            recognizedText.textContent =
                "🗣️ " + spoken;


            console.log(
                "VOICE:",
                spoken
            );


            /*
             * STRICT MATCH
             *
             * Only exact mantra /
             * all mantra words match.
             */

            if (
                isMantraMatch(
                    spoken
                )
            ) {

                console.log(
                    "MANTRA MATCH"
                );


                addCount();


            } else {

                console.log(
                    "NOT MANTRA"
                );


                statusDisplay.textContent =
                    "🔎 మంత్రం సరిపోలలేదు — Count మారలేదు";

            }

        };


    /* =====================================
       ERROR
       ===================================== */

    rec.onerror =
        function(event) {

            console.log(
                "Speech Error:",
                event.error
            );


            isListening =
                false;

            starting =
                false;


            startBtn.disabled =
                false;

            stopBtn.disabled =
                true;


            if (
                event.error ===
                "not-allowed"
            ) {

                statusDisplay.textContent =
                    "🎤 Microphone Permission Allow చేయండి.";

            }

            else if (
                event.error ===
                "service-not-allowed"
            ) {

                statusDisplay.textContent =
                    "🎤 Browserలో Microphone permission Allow చేయండి.";

            }

            else if (
                event.error ===
                "no-speech"
            ) {

                statusDisplay.textContent =
                    "🎤 మంత్రం వినిపించలేదు. మళ్లీ ప్రయత్నించండి.";

            }

            else {

                statusDisplay.textContent =
                    "⚠️ Voice error: " +
                    event.error;

            }

        };


    /* =====================================
       END
       ===================================== */

    rec.onend =
        function() {

            isListening =
                false;

            starting =
                false;


            startBtn.disabled =
                false;

            stopBtn.disabled =
                true;


            if (
                count < target
            ) {

                statusDisplay.textContent =
                    "🎤 మళ్లీ Start నొక్కి మంత్రం పలకండి";

            }

        };


    return rec;

}


/* =========================================
   START MANTRA
   ========================================= */

function startMantra() {

    if (starting) {

        return;

    }


    /*
     * Check mantra
     */

    const mantra =
        mantraInput.value.trim();


    if (!mantra) {

        statusDisplay.textContent =
            "⚠️ ముందుగా మంత్రాన్ని నమోదు చేయండి.";

        mantraInput.focus();

        return;

    }


    /*
     * Target
     */

    target =
        parseInt(
            targetInput.value,
            10
        ) || 1;


    targetDisplay.textContent =
        target;


    /*
     * Create recognition
     */

    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        return;

    }


    starting =
        true;


    try {

        /*
         * This call must be directly
         * caused by Start button.
         *
         * Chrome can therefore request
         * microphone permission.
         */

        recognition.start();

    }

    catch(error) {

        console.log(
            "Start error:",
            error
        );

        starting =
            false;

    }

}


/* =========================================
   STOP
   ========================================= */

function stopMantra() {

    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(
                "Stop error:",
                error
            );

        }

    }


    isListening =
        false;

    starting =
        false;


    startBtn.disabled =
        false;

    stopBtn.disabled =
        true;


    if (
        count < target
    ) {

        statusDisplay.textContent =
            "⏹️ జపం ఆపబడింది";

    }

}


/* =========================================
   COMPLETE
   ========================================= */

function completeJapam() {

    stopMantra();


    statusDisplay.textContent =
        "🎉 జపం పూర్తయింది 🙏";


    completeCard.style.display =
        "block";


    completeMessage.textContent =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    if (
        navigator.vibrate
    ) {

        navigator.vibrate([
            200,
            100,
            200
        ]);

    }

}


/* =========================================
   RESET
   ========================================= */

function resetJapam() {

    stopMantra();


    count =
        0;


    lastCountTime =
        0;


    completeCard.style.display =
        "none";


    recognizedText.textContent =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.textContent =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    updateDisplay();

}


/* =========================================
   INITIAL
   ========================================= */

target =
    parseInt(
        targetInput.value,
        10
    ) || 1100;


updateDisplay();


/* =========================================
   GLOBAL FUNCTIONS
   ========================================= */

window.setTarget =
    setTarget;

window.startMantra =
    startMantra;

window.stopMantra =
    stopMantra;

window.resetJapam =
    resetJapam;
