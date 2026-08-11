"use strict";

/* =====================================================
   MANTRAVOICE
   VOICE JAPAM COUNTER
   Telugu + Sanskrit variations supported
===================================================== */


/* =====================================================
   VARIABLES
===================================================== */

let count = 0;
let target = 1100;

let recognition = null;

let running = false;
let listening = false;
let restarting = false;
let sessionStarting = false;

let restartTimer = null;

let lastCountTime = 0;
let lastSpoken = "";


/* =====================================================
   ELEMENTS
===================================================== */

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


/* =====================================================
   STORAGE
===================================================== */

const STORAGE_COUNT =
    "mantravoice_count";

const STORAGE_TARGET =
    "mantravoice_target";

const STORAGE_MANTRA =
    "mantravoice_mantra";


/* =====================================================
   SAVE
===================================================== */

function saveData() {

    try {

        localStorage.setItem(
            STORAGE_COUNT,
            String(count)
        );

        localStorage.setItem(
            STORAGE_TARGET,
            String(target)
        );

        localStorage.setItem(
            STORAGE_MANTRA,
            mantraInput.value
        );

    }

    catch (error) {

        console.log(
            "Save error:",
            error
        );

    }

}


/* =====================================================
   LOAD
===================================================== */

function loadData() {

    try {

        const savedCount =
            localStorage.getItem(
                STORAGE_COUNT
            );

        const savedTarget =
            localStorage.getItem(
                STORAGE_TARGET
            );

        const savedMantra =
            localStorage.getItem(
                STORAGE_MANTRA
            );


        if (savedCount !== null) {

            count =
                parseInt(
                    savedCount,
                    10
                ) || 0;

        }


        if (savedTarget !== null) {

            target =
                parseInt(
                    savedTarget,
                    10
                ) || 1100;

        }


        if (target < 1) {

            target = 1100;

        }


        if (
            savedMantra &&
            savedMantra.trim()
        ) {

            mantraInput.value =
                savedMantra;

        }


        targetInput.value =
            target;

    }

    catch (error) {

        console.log(
            "Load error:",
            error
        );

    }

}


/* =====================================================
   TEXT NORMALIZATION
===================================================== */

function normalizeText(text) {

    let value =
        String(text || "")
            .toLowerCase()
            .trim();


    /*
       Common Telugu/Sanskrit voice variations
    */

    value =
        value
            .replace(/ఓమ్/g, "ఓం")
            .replace(/ఓమ/g, "ఓం")
            .replace(/నమహ/g, "నమః")
            .replace(/నమః/g, "నమః")
            .replace(/నమశ్శివాయ/g, "నమఃశివాయ")
            .replace(/నమశివాయ/g, "నమఃశివాయ")
            .replace(/నమః శివాయ/g, "నమఃశివాయ")
            .replace(/శివాయా/g, "శివాయ");


    /*
       Remove punctuation
    */

    value =
        value.replace(
            /[.,!?;:"'`।॥,!?]/g,
            " "
        );


    /*
       Normalize spaces
    */

    value =
        value.replace(
            /\s+/g,
            " "
        )
        .trim();


    return value;

}


/* =====================================================
   COMPACT TEXT
===================================================== */

function compactText(text) {

    return normalizeText(text)
        .replace(/\s/g, "");

}


/* =====================================================
   SPECIAL OM NAMAH SHIVAYA DETECTION
===================================================== */

function isOmNamahShivaya(text) {

    const value =
        compactText(text);


    const variations = [

        "ఓంనమఃశివాయ",
        "ఓంనమశివాయ",
        "ఓమ్నమఃశివాయ",
        "ఓమ్నమశివాయ",
        "ఓంనమహశివాయ",
        "ఓమ్నమహశివాయ"

    ];


    for (
        const variation of variations
    ) {

        if (
            value.includes(
                variation
            )
        ) {

            return true;

        }

    }


    /*
       Even if recognition inserts
       small spaces between words
    */

    if (
        value.includes("ఓం") &&
        value.includes("నమ") &&
        value.includes("శివాయ")
    ) {

        return true;

    }


    return false;

}


/* =====================================================
   GENERAL MANTRA MATCH
===================================================== */

function isMantraMatch(spoken) {

    const mantra =
        normalizeText(
            mantraInput.value
        );

    const voice =
        normalizeText(
            spoken
        );


    if (!mantra || !voice) {

        return false;

    }


    /* Exact match */

    if (voice === mantra) {

        return true;

    }


    /* Compact match */

    if (
        compactText(voice) ===
        compactText(mantra)
    ) {

        return true;

    }


    /* Spoken text contains mantra */

    if (
        compactText(voice).includes(
            compactText(mantra)
        )
    ) {

        return true;

    }


    /* Mantra contains spoken text */

    if (
        compactText(mantra).includes(
            compactText(voice)
        ) &&
        compactText(voice).length >= 4
    ) {

        return true;

    }


    /*
       Special handling:
       Om Namah Shivaya
    */

    if (
        isOmNamahShivaya(
            voice
        ) &&
        (
            compactText(mantra)
                .includes("ఓம்") ||
            compactText(mantra)
                .includes("నమఃశివాయ") ||
            compactText(mantra)
                .includes("నమశివాయ")
        )
    ) {

        return true;

    }


    /*
       Word matching
    */

    const targetWords =
        mantra
            .split(" ")
            .filter(Boolean);

    const spokenWords =
        voice
            .split(" ")
            .filter(Boolean);


    if (!targetWords.length) {

        return false;

    }


    let matched = 0;


    for (
        const targetWord of targetWords
    ) {

        for (
            const spokenWord of spokenWords
        ) {

            if (
                spokenWord ===
                targetWord
            ) {

                matched++;

                break;

            }


            if (
                spokenWord.length >= 3 &&
                targetWord.length >= 3
            ) {

                if (
                    spokenWord.includes(
                        targetWord
                    ) ||
                    targetWord.includes(
                        spokenWord
                    )
                ) {

                    matched++;

                    break;

                }

            }

        }

    }


    return (
        matched /
        targetWords.length
        >= 0.66
    );

}


/* =====================================================
   UPDATE DISPLAY
===================================================== */

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


/* =====================================================
   ADD COUNT
===================================================== */

function addCount() {

    if (!running) {

        return;

    }


    if (count >= target) {

        return;

    }


    const now =
        Date.now();


    /*
       Prevent same spoken phrase
       from counting multiple times
    */

    if (
        now -
        lastCountTime <
        1800
    ) {

        return;

    }


    lastCountTime =
        now;


    count++;


    updateDisplay();

    saveData();


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


/* =====================================================
   PROCESS VOICE
===================================================== */

function processVoice(text) {

    if (!running) {

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
        "VOICE RECOGNIZED:",
        spoken
    );


    /*
       Do not reject immediately just because
       text is similar to previous result.
    */

    if (
        spoken === lastSpoken &&
        Date.now() -
        lastCountTime < 1800
    ) {

        return;

    }


    lastSpoken =
        spoken;


    if (
        isMantraMatch(spoken)
    ) {

        addCount();

        return;

    }


    statusDisplay.textContent =
        "🎤 మంత్రం పలకండి...";

}


/* =====================================================
   CREATE SPEECH RECOGNITION
===================================================== */

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


    /*
       Telugu recognition
    */

    rec.lang =
        "te-IN";


    rec.continuous =
        true;


    rec.interimResults =
        false;


    rec.maxAlternatives =
        5;


    /* =================================================
       START
    ================================================= */

    rec.onstart =
        function() {

            listening =
                true;

            restarting =
                false;

            sessionStarting =
                false;


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 వింటున్నాను... మంత్రం పలకండి";

        };


    /* =================================================
       RESULT
    ================================================= */

    rec.onresult =
        function(event) {

            if (!running) {

                return;

            }


            for (
                let i =
                    event.resultIndex;

                i <
                    event.results.length;

                i++
            ) {

                const result =
                    event.results[i];


                if (
                    !result.isFinal
                ) {

                    continue;

                }


                /*
                   Check ALL alternatives
                */

                for (
                    let j = 0;

                    j <
                        result.length;

                    j++
                ) {

                    const text =
                        result[j]
                            .transcript
                            .trim();


                    if (!text) {

                        continue;

                    }


                    console.log(
                        "Alternative:",
                        text
                    );


                    /*
                       If any alternative matches,
                       count immediately.
                    */

                    if (
                        isMantraMatch(
                            text
                        )
                    ) {

                        processVoice(
                            text
                        );

                        break;

                    }


                    /*
                       Show non-matching result
                    */

                    if (
                        j ===
                        result.length - 1
                    ) {

                        processVoice(
                            text
                        );

                    }

                }

            }

        };


    /* =================================================
       ERROR
    ================================================= */

    rec.onerror =
        function(event) {

            console.log(
                "VOICE ERROR:",
                event.error
            );


            listening =
                false;


            if (
                event.error ===
                "not-allowed" ||
                event.error ===
                "service-not-allowed"
            ) {

                running =
                    false;

                restarting =
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
                "no-speech"
            ) {

                if (running) {

                    scheduleRestart();

                }

                return;

            }


            if (running) {

                scheduleRestart();

            }

        };


    /* =================================================
       END
    ================================================= */

    rec.onend =
        function() {

            listening =
                false;


            if (
                running &&
                count < target
            ) {

                scheduleRestart();

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


/* =====================================================
   RESTART
===================================================== */

function scheduleRestart() {

    if (!running) {

        return;

    }


    if (listening) {

        return;

    }


    if (restarting) {

        return;

    }


    restarting =
        true;


    if (restartTimer) {

        clearTimeout(
            restartTimer
        );

    }


    restartTimer =
        setTimeout(
            function() {

                restarting =
                    false;


                if (!running) {

                    return;

                }


                startRecognition();

            },
            700
        );

}


/* =====================================================
   START RECOGNITION
===================================================== */

function startRecognition() {

    if (!running) {

        return;

    }


    if (listening) {

        return;

    }


    if (sessionStarting) {

        return;

    }


    sessionStarting =
        true;


    try {

        recognition.start();

    }

    catch (error) {

        console.log(
            "Recognition start error:",
            error
        );


        sessionStarting =
            false;


        if (running) {

            setTimeout(
                function() {

                    scheduleRestart();

                },
                1000
            );

        }

    }

}


/* =====================================================
   START JAPAM
===================================================== */

function startMantra() {

    if (running) {

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
        ) || 1100;


    if (target < 1) {

        target = 1;

    }


    targetInput.value =
        target;


    saveData();


    running =
        true;

    listening =
        false;

    restarting =
        false;

    sessionStarting =
        false;


    lastCountTime =
        0;

    lastSpoken =
        "";


    completeCard.style.display =
        "none";


    recognizedText.textContent =
        "🎤 మంత్రం కోసం వింటున్నాను...";


    statusDisplay.textContent =
        "🎤 Microphone ప్రారంభమవుతోంది...";


    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        running =
            false;

        return;

    }


    startRecognition();

}


/* =====================================================
   STOP
===================================================== */

function stopMantra() {

    running =
        false;

    listening =
        false;

    restarting =
        false;

    sessionStarting =
        false;


    if (restartTimer) {

        clearTimeout(
            restartTimer
        );

        restartTimer =
            null;

    }


    if (recognition) {

        try {

            recognition.stop();

        }

        catch (error) {

            console.log(
                error
            );

        }

    }


    startBtn.disabled =
        false;

    stopBtn.disabled =
        true;


    statusDisplay.textContent =
        "⏹️ జపం ఆపబడింది";


    saveData();

}


/* =====================================================
   COMPLETE
===================================================== */

function completeJapam() {

    running =
        false;

    listening =
        false;

    restarting =
        false;

    sessionStarting =
        false;


    if (restartTimer) {

        clearTimeout(
            restartTimer
        );

        restartTimer =
            null;

    }


    if (recognition) {

        try {

            recognition.stop();

        }

        catch (error) {

            console.log(
                error
            );

        }

    }


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


    saveData();


    if (
        navigator.vibrate
    ) {

        navigator.vibrate([
            300,
            150,
            300
        ]);

    }

}


/* =====================================================
   RESET
===================================================== */

function resetJapam() {
