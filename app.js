"use strict";

/* =====================================================
   MANTRAVOICE
   CONTINUOUS JAPAM VERSION
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

let restartTimer = null;

let lastCountTime = 0;

let lastSpoken = "";

let sessionStarting = false;


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
   CLEAN TEXT
===================================================== */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
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

    if (voice === mantra) {
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
        let i = 0;
        i < targetWords.length;
        i++
    ) {

        const targetWord =
            targetWords[i];


        for (
            let j = 0;
            j < spokenWords.length;
            j++
        ) {

            const spokenWord =
                spokenWords[j];


            if (
                spokenWord ===
                targetWord
            ) {

                matched++;
                break;

            }


            /*
               Telugu speech recognition
               can join/split words.
            */

            if (
                spokenWord.length >= 3 &&
                targetWord.length >= 3 &&
                (
                    spokenWord.includes(targetWord) ||
                    targetWord.includes(spokenWord)
                )
            ) {

                matched++;
                break;

            }

        }

    }


    /*
       75% words matching
    */

    return (
        matched /
        targetWords.length
        >= 0.75
    );

}


/* =====================================================
   UPDATE DISPLAY
===================================================== */

function updateDisplay() {

    if (countDisplay) {

        countDisplay.textContent =
            count;

    }


    if (targetDisplay) {

        targetDisplay.textContent =
            target;

    }


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


    if (progressBar) {

        progressBar.style.width =
            percentage + "%";

    }

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
       Duplicate protection.

       Same result within 2.5 seconds
       will not count again.
    */

    if (
        now - lastCountTime < 2500
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


    if (statusDisplay) {

        statusDisplay.textContent =
            "🙏 మంత్రం గుర్తించబడింది — " +
            count +
            " / " +
            target;

    }


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


    /*
       Always display recognition result.
    */

    if (recognizedText) {

        recognizedText.textContent =
            "🗣️ " + spoken;

    }


    console.log(
        "VOICE:",
        spoken
    );


    /*
       Do not process exact same
       recognition result repeatedly.
    */

    if (
        spoken === lastSpoken
    ) {

        console.log(
            "Same recognition result ignored"
        );

        return;

    }


    lastSpoken =
        spoken;


    /*
       Check mantra.
    */

    if (
        isMantraMatch(spoken)
    ) {

        console.log(
            "MANTRA MATCH"
        );


        addCount();

    }

    else {

        console.log(
            "NOT A MANTRA"
        );


        if (statusDisplay) {

            statusDisplay.textContent =
                "🎤 మంత్రం పలకండి...";

        }

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

        if (statusDisplay) {

            statusDisplay.textContent =
                "❌ ఈ browserలో Voice Recognition లేదు. Chromeలో ప్రయత్నించండి.";

        }

        return null;

    }


    const rec =
        new SpeechRecognition();


    /*
       Telugu
    */

    rec.lang =
        "te-IN";


    /*
       IMPORTANT
       Continuous listening.
    */

    rec.continuous =
        true;


    /*
       Final results only.
    */

    rec.interimResults =
        false;


    rec.maxAlternatives =
        3;


    /* =================================================
       ON START
    ================================================= */

    rec.onstart =
        function() {

            listening =
                true;

            restarting =
                false;

            sessionStarting =
                false;


            if (startBtn) {

                startBtn.disabled =
                    true;

            }


            if (stopBtn) {

                stopBtn.disabled =
                    false;

            }


            if (statusDisplay) {

                statusDisplay.textContent =
                    "🎤 వింటున్నాను... మంత్రం పలకండి";

            }


            console.log(
                "LISTENING"
            );

        };


    /* =================================================
       ON RESULT
    ================================================= */

    rec.onresult =
        function(event) {

            if (!running) {
                return;
            }


            /*
               Process only NEW final results.
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


                /*
                   Try recognition alternatives.
                */

                let bestText = "";


                for (
                    let j = 0;
                    j < result.length;
                    j++
                ) {

                    const text =
                        result[j]
                            .transcript
                            .trim();


                    if (!text) {
                        continue;
                    }


                    /*
                       Prefer an actual mantra match.
                    */

                    if (
                        isMantraMatch(text)
                    ) {

                        bestText =
                            text;

                        break;

                    }


                    /*
                       Otherwise keep first result
                       for display.
                    */

                    if (!bestText) {

                        bestText =
                            text;

                    }

                }


                if (bestText) {

                    processVoice(
                        bestText
                    );

                }

            }

        };


    /* =================================================
       ON ERROR
    ================================================= */

    rec.onerror =
        function(event) {

            console.log(
                "VOICE ERROR:",
                event.error
            );


            listening =
                false;


            /*
               Permission errors are permanent
               until user allows microphone.
            */

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


                if (startBtn) {

                    startBtn.disabled =
                        false;

                }


                if (stopBtn) {

                    stopBtn.disabled =
                        true;

                }


                if (statusDisplay) {

                    statusDisplay.textContent =
                        "🎤 Microphone Permission Allow చేయండి.";

                }


                return;

            }


            /*
               Other errors:
               automatically restart.
            */

            if (running) {

                scheduleRestart();

            }

        };


    /* =================================================
       ON END
    ================================================= */

    rec.onend =
        function() {

            listening =
                false;


            console.log(
                "VOICE SESSION ENDED"
            );


            /*
               User did not press Stop.

               Automatically start a new
               recognition session.
            */

            if (
                running &&
                count < target
            ) {

                scheduleRestart();

            }

            else {

                if (startBtn) {

                    startBtn.disabled =
                        false;

                }


                if (stopBtn) {

                    stopBtn.disabled =
                        true;

                }

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


    /*
       Small delay prevents Chrome
       InvalidStateError.
    */

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

    catch(error) {

        console.log(
            "RECOGNITION START ERROR:",
            error
        );


        sessionStarting =
            false;


        /*
           Already started:
           wait for onstart/onend.
        */

        if (
            String(error.message || "")
                .toLowerCase()
                .includes("already started")
        ) {

            listening =
                true;

            return;

        }


        /*
           Try again.
        */

        if (running) {

            setTimeout(
                function() {

                    sessionStarting =
                        false;

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

    /*
       If already running,
       NEVER start another session.
    */

    if (running) {

        console.log(
            "Already running"
        );

        return;

    }


    const mantra =
        mantraInput.value.trim();


    if (!mantra) {

        if (statusDisplay) {

            statusDisplay.textContent =
                "⚠️ ముందుగా మంత్రాన్ని నమోదు చేయండి.";

        }


        mantraInput.focus();

        return;

    }


    target =
        parseInt(
            targetInput.value,
            10
        ) || 1100;


    if (target < 1) {

        target =
            1;

    }


    targetInput.value =
        target;


    targetDisplay.textContent =
        target;


    /*
       START continuous mode.
    */

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


    /*
       Create recognition once.
    */

    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        running =
            false;

        return;

    }


    /*
       Start microphone.
    */

    startRecognition();

}


/* =====================================================
   STOP MANTRA
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

        catch(error) {

            console.log(
                "STOP ERROR:",
                error
            );

        }

    }


    if (startBtn) {

        startBtn.disabled =
            false;

    }


    if (stopBtn) {

        stopBtn.disabled =
            true;

    }


    if (statusDisplay) {

        statusDisplay.textContent =
            "⏹️ జపం ఆపబడింది";

    }

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

        catch(error) {

            console.log(error);

        }

    }


    if (startBtn) {

        startBtn.disabled =
            false;

    }


    if (stopBtn) {

        stopBtn.disabled =
            true;

    }


    if (completeCard) {

        completeCard.style.display =
            "block";

    }


    if (completeMessage) {

        completeMessage.textContent =
            target +
            " జపాలు పూర్తయ్యాయి 🙏";

    }


    if (statusDisplay) {

        statusDisplay.textContent =
            "🎉 జపం పూర్తయింది!";

    }


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


    target =
        parseInt(
            targetInput.value,
            10
        ) || 1100;


    lastCountTime =
        0;

    lastSpoken =
        "";


    completeCard.style.display =
        "none";


    if (recognizedText) {

        recognizedText.textContent =
            "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";

    }


    if (statusDisplay) {

        statusDisplay.textContent =
            "🎤 Start నొక్కి మంత్రం పలకండి";

    }


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


    updateDisplay();


    if (statusDisplay) {

        statusDisplay.textContent =
            "🎯 Target " +
            target +
            " ఎంచుకున్నారు";

    }

}


/* =====================================================
   TARGET CHANGE
===================================================== */

targetInput.addEventListener(
    "change",
    function() {

        stopMantra();


        target =
            parseInt(
                targetInput.value,
                10
            ) || 1;


        if (target < 1) {

            target =
                1;

        }


        targetInput.value =
            target;


        updateDisplay();

    }
);


/* =====================================================
   INITIAL
===================================================== */

target =
    parseInt(
        targetInput.value,
        10
    ) || 1100;


updateDisplay();


/* =====================================================
   GLOBAL FUNCTIONS
=============================
