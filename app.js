"use strict";

/* =========================================
   MantraVoice
   CONTINUOUS MANTRA COUNTER
   ========================================= */

let count = 0;
let target = 1100;

let recognition = null;

let isListening = false;
let shouldListen = false;

let processing = false;

let lastCountTime = 0;
let lastCountText = "";

let silenceTimer = null;


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
   NORMALIZE TEXT
   ========================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================
   COMPACT TEXT
   ========================================= */

function compactText(text) {

    return normalizeText(text)
        .replace(/\s/g, "");

}


/* =========================================
   MANTRA MATCH
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
     * EXACT MATCH
     */

    if (spoken === mantra) {

        return true;

    }


    /*
     * WITHOUT SPACES
     */

    if (
        compactText(spoken) ===
        compactText(mantra)
    ) {

        return true;

    }


    /*
     * WORD MATCH
     */

    const mantraWords =
        mantra
        .split(" ")
        .filter(function(word) {

            return word.length >= 2;

        });


    const spokenWords =
        spoken
        .split(" ")
        .filter(function(word) {

            return word.length >= 2;

        });


    if (
        mantraWords.length === 0
    ) {

        return false;

    }


    let matchedWords = 0;


    mantraWords.forEach(
        function(mantraWord) {

            const found =
                spokenWords.some(
                    function(spokenWord) {

                        return (
                            spokenWord ===
                            mantraWord
                        );

                    }
                );


            if (found) {

                matchedWords++;

            }

        }
    );


    /*
     * ALL WORDS REQUIRED
     */

    return (
        matchedWords ===
        mantraWords.length
    );

}


/* =========================================
   DISPLAY
   ========================================= */

function updateDisplay() {

    countDisplay.textContent =
        count;

    targetDisplay.textContent =
        target;


    let percent = 0;


    if (target > 0) {

        percent =
            (count / target) * 100;

    }


    percent =
        Math.min(
            100,
            percent
        );


    progressBar.style.width =
        percent + "%";

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

    lastCountText = "";


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

function addCount(spokenText) {

    if (count >= target) {

        return;

    }


    const now =
        Date.now();


    /*
     * Same result repeated by browser
     */

    if (
        spokenText ===
        lastCountText &&
        now - lastCountTime < 4000
    ) {

        console.log(
            "Duplicate mantra ignored"
        );

        return;

    }


    /*
     * Minimum gap between counts.
     */

    if (
        now - lastCountTime < 2500
    ) {

        console.log(
            "Too soon - ignored"
        );

        return;

    }


    lastCountTime =
        now;


    lastCountText =
        spokenText;


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
   PROCESS SPEECH
   ========================================= */

function processSpeech(text) {

    if (!shouldListen) {

        return;

    }


    const spoken =
        normalizeText(text);


    if (!spoken) {

        return;

    }


    recognizedText.textContent =
        "🗣️ " + spoken;


    console.log(
        "Speech:",
        spoken
    );


    /*
     * If already processing this
     * exact recognition result,
     * ignore it.
     */

    if (processing) {

        return;

    }


    if (
        isMantraMatch(spoken)
    ) {

        processing = true;


        addCount(spoken);


        /*
         * Unlock after a short delay.
         * This prevents the same utterance
         * from being counted multiple times.
         */

        setTimeout(
            function() {

                processing = false;

            },
            1800
        );


    } else {

        statusDisplay.textContent =
            "🎤 మంత్రం పలకండి... Count: " +
            count;

    }

}


/* =========================================
   CREATE RECOGNITION
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
     * IMPORTANT
     *
     * Continuous listening.
     */

    rec.continuous =
        true;


    /*
     * We need final results.
     */

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


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 వింటున్నాను... మంత్రం పలకండి";


            console.log(
                "Microphone listening"
            );

        };


    /* =====================================
       RESULT
       ===================================== */

    rec.onresult =
        function(event) {

            if (!shouldListen) {

                return;

            }


            /*
             * Process every FINAL result.
             */

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result =
                    event.results[i];


                if (!result.isFinal) {

                    continue;

                }


                const spoken =
                    result[0]
                        .transcript
                        .trim();


                if (!spoken) {

                    continue;

                }


                processSpeech(
                    spoken
                );

            }

        };


    /* =====================================
       ERROR
       ===================================== */

    rec.onerror =
        function(event) {

            console.log(
                "Speech error:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                shouldListen =
                    false;

                isListening =
                    false;


                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;


                statusDisplay.textContent =
                    "🎤 Microphone Permission Allow చేయండి.";

                return;

            }


            if (
                event.error ===
                "service-not-allowed"
            ) {

                shouldListen =
                    false;

                isListening =
                    false;


                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;


                statusDisplay.textContent =
                    "🎤 Microphone permission అవసరం.";

                return;

            }


            if (
                event.error ===
                "no-speech"
            ) {

                /*
                 * Do NOT stop the app.
                 * Continuous mode will restart.
                 */

                statusDisplay.textContent =
                    "🎤 వింటున్నాను... మంత్రం పలకండి";

                return;

            }

        };


    /* =====================================
       END
       ===================================== */

    rec.onend =
        function() {

            isListening =
                false;


            /*
             * IMPORTANT:
             *
             * Browser sometimes automatically
             * stops SpeechRecognition.
             *
             * If user did NOT press Stop,
             * start it again automatically.
             */

            if (
                shouldListen &&
                count < target
            ) {

                setTimeout(
                    restartRecognition,
                    300
                );

            } else {

                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;

            }

        };


    return rec;

}


/* =========================================
   RESTART
   ========================================= */

function restartRecognition() {

    if (!shouldListen) {

        return;

    }


    if (isListening) {

        return;

    }


    try {

        recognition.start();

    }

    catch(error) {

        console.log(
            "Restart:",
            error
        );


        setTimeout(
            restartRecognition,
            700
        );

    }

}


/* =========================================
   START MANTRA
   ========================================= */

function startMantra() {

    /*
     * If already listening,
     * do nothing.
     */

    if (isListening) {

        return;

    }


    const mantra =
        mantraInput.value.trim();


    if (!mantra) {

        statusDisplay.textContent =
            "⚠️ ముందుగా మంత్రాన్ని నమోదు చేయండి.";

        mantraInput.focus();

        return;

    }


    target =
        parseInt(
            targetInput.value,
            10
        ) || 1;


    targetDisplay.textContent =
        target;


    /*
     * User wants listening ON.
     */

    shouldListen =
        true;


    processing =
        false;


    /*
     * Create once.
     */

    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        shouldListen =
            false;

        return;

    }


    try {

        recognition.start();

    }

    catch(error) {

        console.log(
            "Start:",
            error
        );

    }

}


/* =========================================
   STOP
   ========================================= */

function stopMantra() {

    shouldListen =
        false;


    processing =
        false;


    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(
                error
            );

        }

    }


    isListening =
        false;


    startBtn.disabled =
        false;

    stopBtn.disabled =
        true;


    statusDisplay.textContent =
        "⏹️ జపం ఆపబడింది";

}


/* =========================================
   COMPLETE
   ========================================= */

function completeJapam() {

    shouldListen =
        false;


    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(error);

        }

    }


    isListening =
        false;


    startBtn.disabled =
        false;

    stopBtn.disabled =
        true;


    completeCard.style.display =
        "block";


    completeMessage.textContent =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.textContent =
        "🎉 జపం పూర్తయింది!";


    if (
        navigator.vibrate
    ) {

        navigator.vibrate([
            250,
            120,
            250
        ]);

    }

}


/* =========================================
   RESET
   ========================================= */

function resetJapam() {

    stopMantra();


    count = 0;

    lastCountTime = 0;

    lastCountText = "";

    processing = false;


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
