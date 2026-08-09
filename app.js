"use strict";


/* =====================================================
   MantraVoice
   GitHub Pages
   ONE START = CONTINUOUS JAPAM
   ===================================================== */


/* =====================================================
   VARIABLES
   ===================================================== */

let count = 0;

let target = 1100;

let recognition = null;

let listening = false;

let running = false;

let restarting = false;


/*
   Prevent same speech result from counting
   multiple times.
*/

let lastAcceptedText = "";

let lastAcceptedTime = 0;


/*
   When browser sends the same utterance
   multiple times, this lock protects it.
*/

let countLock = false;


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
   NORMALIZE
   ===================================================== */

function normalize(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।॥,]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

}


/* =====================================================
   COMPACT
   ===================================================== */

function compact(text) {

    return normalize(text)
        .replace(/\s/g, "");

}


/* =====================================================
   MANTRA MATCH
   ===================================================== */

function mantraMatches(spoken) {

    const mantra =
        normalize(
            mantraInput.value
        );

    const voice =
        normalize(
            spoken
        );


    if (!mantra || !voice) {

        return false;

    }


    /*
       Exact
    */

    if (voice === mantra) {

        return true;

    }


    /*
       Without spaces
    */

    if (
        compact(voice) ===
        compact(mantra)
    ) {

        return true;

    }


    /*
       Word matching
    */

    const mantraWords =
        mantra
            .split(" ")
            .filter(
                function(word) {

                    return word.length > 1;

                }
            );


    const voiceWords =
        voice
            .split(" ")
            .filter(
                function(word) {

                    return word.length > 1;

                }
            );


    if (
        mantraWords.length === 0
    ) {

        return false;

    }


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

            if (
                targetWord ===
                voiceWords[j]
            ) {

                matched++;

                break;

            }

        }

    }


    /*
       Every mantra word must match.
    */

    return (
        matched ===
        mantraWords.length
    );

}


/* =====================================================
   DISPLAY
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
   TARGET
   ===================================================== */

function setTarget(value) {

    stopMantra();


    target =
        parseInt(
            value,
            10
        ) || 1;


    if (target < 1) {

        target = 1;

    }


    targetInput.value =
        target;


    count = 0;


    lastAcceptedText = "";

    lastAcceptedTime = 0;

    countLock = false;


    completeCard.style.display =
        "none";


    updateDisplay();


    statusDisplay.textContent =
        "🎯 Target " +
        target +
        " ఎంచుకున్నారు";

}


/* =====================================================
   TARGET CHANGE
   ===================================================== */

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


/* =====================================================
   ADD COUNT
   ===================================================== */

function addCount(spokenText) {

    if (!running) {

        return;

    }


    if (count >= target) {

        return;

    }


    const now =
        Date.now();


    /*
       Same text within 3 seconds
       = same mantra result.
    */

    if (
        spokenText ===
        lastAcceptedText &&
        now - lastAcceptedTime < 3000
    ) {

        console.log(
            "Duplicate ignored:",
            spokenText
        );

        return;

    }


    /*
       Global protection.
    */

    if (countLock) {

        return;

    }


    countLock = true;


    lastAcceptedText =
        spokenText;

    lastAcceptedTime =
        now;


    count++;


    updateDisplay();


    statusDisplay.textContent =
        "🙏 జపం గుర్తించబడింది — " +
        count +
        " / " +
        target;


    if (
        navigator.vibrate
    ) {

        navigator.vibrate(50);

    }


    /*
       Unlock after 2 seconds.
    */

    setTimeout(
        function() {

            countLock = false;

        },
        2000
    );


    if (
        count >= target
    ) {

        completeJapam();

    }

}


/* =====================================================
   PROCESS RESULT
   ===================================================== */

function processResult(text) {

    if (!running) {

        return;

    }


    const spoken =
        normalize(text);


    if (!spoken) {

        return;

    }


    recognizedText.textContent =
        "🗣️ " + spoken;


    console.log(
        "FINAL VOICE:",
        spoken
    );


    /*
       ONLY complete mantra can count.
    */

    if (
        mantraMatches(spoken)
    ) {

        addCount(spoken);

    }

    else {

        statusDisplay.textContent =
            "🎤 వింటున్నాను... Count: " +
            count;

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
            "❌ Chrome browserలో ప్రయత్నించండి.";

        return null;

    }


    const rec =
        new SpeechRecognition();


    /*
       IMPORTANT
    */

    rec.lang =
        "te-IN";


    /*
       Continuous listening.
    */

    rec.continuous =
        true;


    /*
       Only final results.
    */

    rec.interimResults =
        false;


    rec.maxAlternatives =
        1;


    /* =================================================
       ON START
       ================================================= */

    rec.onstart =
        function() {

            listening = true;

            restarting = false;


            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.textContent =
                "🎤 వింటున్నాను... మంత్రం పలకండి";

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
               Process ONLY new final results.
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


                const text =
                    result[0]
                        .transcript
                        .trim();


                if (!text) {

                    continue;

                }


                processResult(text);

            }

        };


    /* =================================================
       ON ERROR
       ================================================= */

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

                running = false;

                listening = false;


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

                running = false;

                listening = false;


                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;


                statusDisplay.textContent =
                    "🎤 Microphone permission అవసరం.";

                return;

            }


            /*
               no-speech is NOT a fatal error.
            */

            if (
                event.error ===
                "no-speech"
            ) {

                statusDisplay.textContent =
                    "🎤 వింటున్నాను...";

            }

        };


    /* =================================================
       ON END
       ================================================= */

    rec.onend =
        function() {

            listening = false;


            /*
               User did not press Stop.
               Restart automatically.
            */

            if (
                running &&
                count < target &&
                !restarting
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


/* =====================================================
   RESTART
   ===================================================== */

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


    restarting = true;


    setTimeout(
        function() {

            if (!running) {

                restarting = false;

                return;

            }


            try {

                recognition.start();

            }

            catch(error) {

                console.log(
                    "Restart error:",
                    error
                );


                restarting = false;


                setTimeout(
                    restartRecognition,
                    1000
                );

            }

        },
        500
    );

}


/* =====================================================
   START
   ===================================================== */

function startMantra() {

    /*
       Already running?
       Do NOTHING.
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
        ) || 1;


    targetDisplay.textContent =
        target;


    /*
       Start continuous mode.
    */

    running = true;


    listening = false;

    restarting = false;


    lastAcceptedText = "";

    lastAcceptedTime = 0;

    countLock = false;


    completeCard.style.display =
        "none";


    /*
       Create recognition only once.
    */

    if (!recognition) {

        recognition =
            createRecognition();

    }


    if (!recognition) {

        running = false;

        return;

    }


    try {

        recognition.start();

    }

    catch(error) {

        console.log(
            "Start error:",
            error
        );


        /*
           Sometimes browser says
           recognition already started.
        */

        if (
            !listening
        ) {

            setTimeout(
                restartRecognition,
                700
            );

        }

    }

}


/* =====================================================
   STOP
   ===================================================== */

function stopMantra() {

    running = false;

    restarting = false;

    listening = false;


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


/* =====================================================
   COMPLETE
   ===================================================== */

function completeJapam() {

    running = false;

    restarting = false;


    if (recognition) {

        try {

            recognition.stop();

        }

        catch(error) {

            console.log(error);

        }

    }


    listening = false;


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


/* =====================================================
   RESET
   ===================================================== */

function resetJapam() {

    stopMantra();


    count = 0;


    lastAcceptedText = "";

    lastAcceptedTime = 0;

    countLock = false;


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
   GLOBAL BUTTON FUNCTIONS
   ===================================================== */

window.startMantra =
    startMantra;

window.stopMantra =
    stopMantra;

window.resetJapam =
    resetJapam;

window.setTarget =
    setTarget;
