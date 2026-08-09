"use strict";

/* =========================================
   MantraVoice
   ONE MANTRA = ONE COUNT
   ========================================= */

let count = 0;
let target = 1100;

let recognition = null;
let isListening = false;
let starting = false;

/*
   One complete mantra gets one count.
   After counting, we lock counting until
   the user has started a NEW recognition cycle.
*/
let mantraLocked = false;

let lastSpokenMantra = "";
let lastCountTime = 0;


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
   TEXT NORMALIZE
   ========================================= */

function normalizeText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

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
       Exact match
    */

    if (spoken === mantra) {

        return true;

    }


    /*
       Compare without spaces.
       Useful for Telugu speech recognition.
    */

    const mantraCompact =
        mantra.replace(/\s/g, "");

    const spokenCompact =
        spoken.replace(/\s/g, "");


    if (
        spokenCompact ===
        mantraCompact
    ) {

        return true;

    }


    /*
       Word-by-word match.
    */

    const mantraWords =
        mantra.split(" ")
        .filter(function(word) {

            return word.length >= 2;

        });


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


    let matched = 0;


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

                matched++;

            }

        }
    );


    /*
       ALL mantra words must match.
    */

    return (
        matched ===
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
   TARGET
   ========================================= */

function setTarget(value) {

    stopMantra();

    target =
        Number(value) || 1;

    targetInput.value =
        target;

    count = 0;

    mantraLocked = false;

    lastSpokenMantra = "";

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

    /*
       Already locked?
       Don't count again.
    */

    if (mantraLocked) {

        return;

    }


    if (count >= target) {

        return;

    }


    const now =
        Date.now();


    /*
       Extra duplicate protection.
    */

    if (
        now - lastCountTime <
        3000
    ) {

        return;

    }


    lastCountTime =
        now;


    /*
       LOCK immediately.
    */

    mantraLocked =
        true;


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

        navigator.vibrate(60);

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
       IMPORTANT:
       One recognition session = one mantra.
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


            /*
               New recognition cycle.
               Unlock counting.
            */

            mantraLocked =
                false;


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 మంత్రం పలకండి";


            recognizedText.textContent =
                "🎤 వినడానికి సిద్ధంగా ఉంది...";

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


            recognizedText.textContent =
                "🗣️ " + spoken;


            console.log(
                "VOICE:",
                spoken
            );


            /*
               If this recognition cycle
               already counted, ignore all
               additional results.
            */

            if (mantraLocked) {

                console.log(
                    "Duplicate result ignored:",
                    spoken
                );

                return;

            }


            /*
               Check complete mantra.
            */

            if (
                isMantraMatch(
                    spoken
                )
            ) {

                console.log(
                    "MANTRA CONFIRMED:",
                    spoken
                );


                addCount();


            } else {

                statusDisplay.textContent =
                    "🔎 మంత్రం పూర్తిగా సరిపోలలేదు — Count మారలేదు";

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
                "no-speech"
            ) {

                statusDisplay.textContent =
                    "🎤 మంత్రం వినిపించలేదు. మళ్లీ Start నొక్కండి.";

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

                /*
                   Recognition ended.
                   Next Start creates a new
                   cycle and unlocks counting.
                */

                if (!mantraLocked) {

                    statusDisplay.textContent =
                        "🎤 మంత్రం వినిపించలేదు — మళ్లీ Start నొక్కండి";

                }

                else {

                    statusDisplay.textContent =
                        "🙏 ఒక జపం పూర్తయింది — తదుపరి జపానికి Start నొక్కండి";

                }

            }

        };


    return rec;

}


/* =========================================
   START
   ========================================= */

function startMantra() {

    if (starting || isListening) {

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
       Create recognition.
    */

    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        return;

    }


    /*
       New mantra cycle.
    */

    mantraLocked =
        false;

    starting =
        true;


    try {

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

    mantraLocked =
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

    starting =
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


    count =
        0;


    target =
        parseInt(
            targetInput.value,
            10
        ) || 1100;


    mantraLocked =
        false;


    lastSpokenMantra =
        "";


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
   GLOBAL
   ========================================= */

window.setTarget =
    setTarget;

window.startMantra =
    startMantra;

window.stopMantra =
    stopMantra;

window.resetJapam =
    resetJapam;
