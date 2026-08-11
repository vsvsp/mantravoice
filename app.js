"use strict";

/* =====================================================
   MANTRAVOICE
   CONTINUOUS JAPAM + AUTO SAVE
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
   SAVE DATA
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
   LOAD DATA
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
   CLEAN TEXT
===================================================== */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(
            /[.,!?;:"'`।॥]/g,
            " "
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* =====================================================
   COMPACT TEXT
===================================================== */

function compactText(text) {

    return cleanText(text)
        .replace(/\s/g, "");

}


/* =====================================================
   MANTRA MATCH
===================================================== */

function isMantraMatch(spoken) {

    const mantra =
        cleanText(
            mantraInput.value
        );

    const voice =
        cleanText(
            spoken
        );


    if (!mantra || !voice) {

        return false;

    }


    /* Exact */

    if (
        voice === mantra
    ) {

        return true;

    }


    /* Without spaces */

    if (
        compactText(voice) ===
        compactText(mantra)
    ) {

        return true;

    }


    /*
       Voice recognition may return
       slightly different Telugu forms.
    */

    const variations = [

        "ఓం నమఃశివాయ",
        "ఓం నమః శివాయ",
        "ఓం నమ శివాయ",
        "ఓం నమశివాయ",
        "ఓం నమశ్శివాయ",
        "ఓం నమహ శివాయ",
        "ఓం నమహశివాయ",
        "ఓమ్నమఃశివాయ",
        "ఓమ్నమశివాయ"

    ];


    const compactVoice =
        compactText(
            voice
        );


    for (
        const variation of variations
    ) {

        if (
            compactVoice.includes(
                compactText(
                    variation
                )
            )
        ) {

            return true;

        }

    }


    /*
       Special OM NAMAH SHIVAYA detection
    */

    if (
        compactVoice.includes("ఓం") &&
        compactVoice.includes("నమ") &&
        compactVoice.includes("శివాయ")
    ) {

        return true;

    }


    /*
       General word matching
    */

    const targetWords =
        mantra
            .split(" ")
            .filter(Boolean);

    const spokenWords =
        voice
            .split(" ")
            .filter(Boolean);


    if (
        !targetWords.length
    ) {

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
                spokenWord.length >= 2 &&
                targetWord.length >= 2 &&
                (
                    spokenWord.includes(
                        targetWord
                    ) ||
                    targetWord.includes(
                        spokenWord
                    )
                )
            ) {

                matched++;

                break;

            }

        }

    }


    return (
        matched /
        targetWords.length
        >= 0.60
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


    if (
        target > 0
    ) {

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


    if (
        count >= target
    ) {

        return;

    }


    const now =
        Date.now();


    /*
       Duplicate protection.

       800ms allows faster continuous japam
       while still blocking duplicate results.
    */

    if (
        now -
        lastCountTime <
        800
    ) {

        console.log(
            "Duplicate count blocked"
        );

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
        cleanText(text);


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
       Only block the exact same recognition result
       when it happens very quickly.
    */

    const now =
        Date.now();


    if (
        spoken === lastSpoken &&
        now -
        lastCountTime <
        800
    ) {

        return;

    }


    lastSpoken =
        spoken;


    if (
        isMantraMatch(spoken)
    ) {

        addCount();

    }

    else {

        statusDisplay.textContent =
            "🎤 మంత్రం పలకండి...";

    }

}


/* =====================================================
   CREATE RECOGNITION
===================================================== */

function createRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        statusDisplay.textContent =
            "❌ ఈ browserలో Voice Recognition లేదు. Chromeలో ప్రయత్నించండి.";

        return null;

    }


    const rec =
        new SpeechRecognition();


    /*
       Telugu language
    */

    rec.lang =
        "te-IN";


    /*
       Continuous listening
    */

    rec.continuous =
        true;


    /*
       Final results only
    */

    rec.interimResults =
        false;


    /*
       More alternatives
    */

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


                let foundMatch =
                    false;


                /*
                   Check all alternatives.
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
                        "VOICE ALTERNATIVE:",
                        text
                    );


                    if (
                        isMantraMatch(
                            text
                        )
                    ) {

                        processVoice(
                            text
                        );

                        foundMatch =
                            true;

                        break;

                    }

                }


                /*
                   If no alternative matched,
                   show the first recognized text.
                */

                if (
                    !foundMatch &&
                    result[0]
                ) {

                    processVoice(
                        result[0]
                            .transcript
                    );

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


            /*
               no-speech is normal.
               Restart recognition.
            */

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


            sessionStarting =
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
   SCHEDULE RESTART
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
            "START ERROR:",
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
   START MANTRA
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


    if (
        target < 1
    ) {

        target =
            1;

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

    stopMantra();


    count =
        0;


    lastCountTime =
        0;

    lastSpoken =
        "";


    completeCard.style.display =
        "none";


    recognizedText.textContent =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.textContent =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    saveData();


    updateDisplay();

}


/* =====================================================
   SET TARGET
===================================================== */

function setTarget(value) {

    stopMantra();


    target =
        Number(value) || 1;


    targetInput.value =
        target;


    count =
        0;


    lastCountTime =
        0;

    lastSpoken =
        "";


    completeCard.style.display =
        "none";


    saveData();


    updateDisplay();


    statusDispla
