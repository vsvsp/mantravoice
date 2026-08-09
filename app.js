"use strict";

/* =========================================
   MANTRAVOICE - FINAL VOICE COUNTER
   ========================================= */

let count = 0;
let target = 1100;

let recognition = null;

let running = false;
let listening = false;
let restarting = false;

let lastCountTime = 0;


/* =========================================
   ELEMENTS
   ========================================= */

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


/* =========================================
   NORMALIZE TELUGU
   ========================================= */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


/* =========================================
   REMOVE SPACES
   ========================================= */

function noSpaces(text) {

    return cleanText(text)
        .replace(/\s/g, "");

}


/* =========================================
   MANTRA CHECK
   ========================================= */

function checkMantra(spoken) {

    const mantra =
        cleanText(mantraInput.value);

    const voice =
        cleanText(spoken);


    if (!mantra || !voice) {
        return false;
    }


    /*
     EXACT MATCH
    */

    if (voice === mantra) {
        return true;
    }


    /*
     WITHOUT SPACES
    */

    if (
        noSpaces(voice) ===
        noSpaces(mantra)
    ) {
        return true;
    }


    /*
     MANTRA WORDS
    */

    const mantraWords =
        mantra
            .split(" ")
            .filter(Boolean);


    const voiceWords =
        voice
            .split(" ")
            .filter(Boolean);


    if (
        mantraWords.length === 0
    ) {
        return false;
    }


    /*
     Count matching words
    */

    let matched = 0;


    for (
        let i = 0;
        i < mantraWords.length;
        i++
    ) {

        const targetWord =
            mantraWords[i];


        for (
            let j = 0;
            j < voiceWords.length;
            j++
        ) {

            const spokenWord =
                voiceWords[j];


            /*
             Exact word
            */

            if (
                spokenWord ===
                targetWord
            ) {

                matched++;

                break;
            }


            /*
             Small recognition differences
             */

            if (
                spokenWord.includes(targetWord) ||
                targetWord.includes(spokenWord)
            ) {

                if (
                    spokenWord.length >= 2 &&
                    targetWord.length >= 2
                ) {

                    matched++;

                    break;
                }

            }

        }

    }


    /*
     At least 75% words must match
    */

    const percentage =
        matched /
        mantraWords.length;


    return percentage >= 0.75;

}


/* =========================================
   UPDATE DISPLAY
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
        Math.min(100, percent);


    progressBar.style.width =
        percent + "%";

}


/* =========================================
   ADD COUNT
   ========================================= */

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
     IMPORTANT:
     One mantra cannot count again
     immediately.

     This prevents Chrome from sending
     the same sentence multiple times.
    */

    if (
        now - lastCountTime < 2200
    ) {

        console.log(
            "Duplicate voice ignored"
        );

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

        navigator.vibrate(60);

    }


    if (
        count >= target
    ) {

        completeJapam();

    }

}


/* =========================================
   PROCESS VOICE
   ========================================= */

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
     ALWAYS SHOW WHAT CHROME HEARD
    */

    recognizedText.textContent =
        "🗣️ " + spoken;


    console.log(
        "VOICE RECEIVED:",
        spoken
    );


    /*
     CHECK MANTRA
    */

    if (
        checkMantra(spoken)
    ) {

        console.log(
            "MANTRA MATCH"
        );


        addCount();

    }

    else {

        console.log(
            "MANTRA NOT MATCHED"
        );


        statusDisplay.textContent =
            "🎤 మంత్రం పలకండి...";

    }

}


/* =========================================
   CREATE SPEECH RECOGNITION
   ========================================= */

function createRecognition() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        statusDisplay.textContent =
            "❌ Chromeలో Voice Recognition support లేదు.";

        return null;
    }


    const rec =
        new SpeechRecognition();


    rec.lang =
        "te-IN";


    /*
     CONTINUOUS
    */

    rec.continuous =
        true;


    /*
     FINAL RESULTS
    */

    rec.interimResults =
        false;


    rec.maxAlternatives =
        3;


    /* =====================================
       START
       ===================================== */

    rec.onstart =
        function() {

            listening =
                true;

            restarting =
                false;


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 వింటున్నాను... మంత్రం పలకండి";


            console.log(
                "VOICE LISTENING STARTED"
            );

        };


    /* =====================================
       RESULT
       ===================================== */

    rec.onresult =
        function(event) {

            if (!running) {
                return;
            }


            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {

                const result =
                    event.results[i];


                /*
                 Only final result
                */

                if (!result.isFinal) {
                    continue;
                }


                /*
                 Check all alternatives
                */

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


                    console.log(
                        "RECOGNIZED:",
                        text
                    );


                    /*
                     Process first result
                    */

                    processVoice(text);


                    /*
                     Stop checking alternatives
                    */

                    break;

                }

            }

        };


    /* =====================================
       ERROR
       ===================================== */

    rec.onerror =
        function(event) {

            console.log(
                "VOICE ERROR:",
                event.error
            );


            if (
                event.error ===
                "not-allowed"
            ) {

                running =
                    false;

                listening =
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

                running =
                    false;

                listening =
                    false;


                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;


                statusDisplay.textContent =
                    "🎤 Microphone Permission అవసరం.";

                return;
            }


            /*
             no-speech is normal
            */

            if (
                event.error ===
                "no-speech"
            ) {

                statusDisplay.textContent =
                    "🎤 వింటున్నాను...";

            }

        };


    /* =====================================
       END
       ===================================== */

    rec.onend =
        function() {

            listening =
                false;


            /*
             User did NOT press Stop.

             Restart automatically.
            */

            if (
                running &&
                count < target
            ) {

                restartRecognition();

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
   RESTART
   ========================================= */

function restartRecognition() {

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


    setTimeout(
        function() {

            if (!running) {

                restarting =
                    false;

                return;
            }


            try {

                recognition.start();

            }

            catch(error) {

                console.log(
                    "RESTART ERROR:",
                    error
                );


                restarting =
                    false;


                setTimeout(
                    restartRecognition,
                    800
                );

            }

        },
        500
    );

}


/* =========================================
   START
   ========================================= */

function startMantra() {

    /*
     Already running:
     DO NOTHING.
    */

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


    targetDisplay.textContent =
        target;


    running =
        true;


    listening =
        false;


    restarting =
        false;


    lastCountTime =
        0;


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


    try {

        recognition.start();

    }

    catch(error) {

        console.log(
            "START ERROR:",
            error
        );


        /*
         If already running,
         do not start another session.
        */

        setTimeout(
            function() {

                if (
                    running &&
                    !listening
                ) {

                    restartRecognition();

                }

            },
            700
        );

    }

}


/* =========================================
   STOP
   ========================================= */

function stopMantra() {

    running =
        false;

    listening =
        false;

    restarting =
        false;


    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(error);

        }

    }


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

    running =
        false;


    listening =
        false;


    restarting =
        false;


    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(error);

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


    lastCountTime =
        0;


    target =
        parseInt(
            targetInput.value,
            10
        ) || 1100;


    completeCard.style.display =
        "none";


    recognizedText.textContent =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.textContent =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    updateDisplay();

}


/* =========================================
   TARGET BUTTON
   ========================================= */

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


        updateDisplay();

    }
);


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
   BUTTON EXPORT
   ========================================= */

window.startMantra =
    startMantra;

window.stopMantra =
    stopMantra;

window.resetJapam =
    resetJapam;

window.setTarget =
    setTarget;
