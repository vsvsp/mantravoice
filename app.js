let count = 0;
let target = 1100;

let recognition = null;
let isListening = false;
let keepListening = false;
let restarting = false;

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
   VOICE RECOGNITION
========================================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition అందుబాటులో లేదు.";

} else {

    createRecognition();
}


/* =========================================
   CREATE RECOGNITION
========================================= */

function createRecognition() {

    recognition =
        new SpeechRecognition();

    recognition.lang = "te-IN";

    /*
       ఒక్కో speech result వచ్చిన తర్వాత
       session ముగుస్తుంది.
       onendలో మనం automaticగా restart చేస్తాం.
    */

    recognition.continuous = false;

    recognition.interimResults = false;


    /* =====================================
       START
    ===================================== */

    recognition.onstart = function () {

        isListening = true;

        restarting = false;

        startBtn.disabled = true;

        stopBtn.disabled = false;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రం పలకండి";
    };


    /* =====================================
       RESULT
    ===================================== */

    recognition.onresult = function (event) {

        const spoken =
            event.results[0][0]
            .transcript
            .trim();


        if (!spoken) {
            return;
        }


        /*
           User చెప్పిన మాట చూపిస్తుంది
        */

        recognizedText.innerText =
            spoken;


        /*
           మంత్రం verify
        */

        const wanted =
            normalizeMantra(
                mantraInput.value
            );


        const spokenText =
            normalizeMantra(
                spoken
            );


        const similarity =
            mantraSimilarity(
                wanted,
                spokenText
            );


        console.log(
            "Mantra:",
            wanted
        );

        console.log(
            "Speech:",
            spokenText
        );

        console.log(
            "Similarity:",
            similarity
        );


        /*
           75% లేదా అంతకంటే ఎక్కువ
           similarity ఉంటే count.
        */

        if (similarity >= 0.75) {

            addCount();

            if (count < target) {

                statusDisplay.innerText =
                    "🙏 మంత్రం గుర్తించబడింది — Count " +
                    count;
            }

        } else {

            statusDisplay.innerText =
                "🔎 మంత్రం సరిపోలలేదు — Count మారలేదు";
        }
    };


    /* =====================================
       ERROR
    ===================================== */

    recognition.onerror =
        function (event) {

            console.log(
                "Speech Error:",
                event.error
            );


            isListening = false;


            /*
               Permission సమస్య అయితే
               automatic restart చేయకూడదు.
            */

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed"
            ) {

                keepListening = false;

                startBtn.disabled = false;

                stopBtn.disabled = true;

                statusDisplay.innerText =
                    "🎤 Microphone permission అవసరం";

                return;
            }


            /*
               ఇతర చిన్న errorsకి
               listening కొనసాగుతుంది.
            */

            if (keepListening) {

                restartRecognition();
            }
        };


    /* =====================================
       END
    ===================================== */

    recognition.onend =
        function () {

            isListening = false;


            /*
               User Stop నొక్కకపోతే
               automaticగా మళ్లీ listening.
            */

            if (
                keepListening &&
                count < target
            ) {

                restartRecognition();

            } else {

                startBtn.disabled = false;

                stopBtn.disabled = true;
            }
        };
}


/* =========================================
   NORMALIZE MANTRA
========================================= */

function normalizeMantra(text) {

    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================================
   MANTRA SIMILARITY
========================================= */

function mantraSimilarity(a, b) {

    if (!a || !b) {
        return 0;
    }


    /*
       Exact match
    */

    if (a === b) {
        return 1;
    }


    /*
       Wordsగా విడగొట్టడం
    */

    const aWords =
        a.split(" ")
        .filter(Boolean);


    const bWords =
        b.split(" ")
        .filter(Boolean);


    if (
        aWords.length === 0 ||
        bWords.length === 0
    ) {
        return 0;
    }


    let matched = 0;


    /*
       ప్రతి mantra word
       speechలో ఉందా చూడటం
    */

    aWords.forEach(
        function (word) {

            if (
                bWords.includes(word)
            ) {

                matched++;
            }
        }
    );


    /*
       రెండు వైపులా match percentage
    */

    const score =
        matched /
        Math.max(
            aWords.length,
            bWords.length
        );


    return score;
}


/* =========================================
   RESTART RECOGNITION
========================================= */

function restartRecognition() {

    if (
        !keepListening ||
        isListening ||
        restarting
    ) {
        return;
    }


    restarting = true;


    setTimeout(
        function () {

            if (!keepListening) {

                restarting = false;

                return;
            }


            try {

                createRecognition();

                recognition.start();

            } catch (error) {

                console.log(
                    "Restart error:",
                    error
                );


                restarting = false;


                setTimeout(
                    restartRecognition,
                    700
                );
            }

        },
        400
    );
}


/* =========================================
   START MANTRA
========================================= */

function startMantra() {

    if (!recognition) {

        alert(
            "ఈ browserలో Voice Recognition support లేదు."
        );

        return;
    }


    target =
        parseInt(
            targetInput.value
        ) || 108;


    targetDisplay.innerText =
        target;


    completeCard.style.display =
        "none";


    keepListening = true;


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Start error:",
            error
        );


        restartRecognition();
    }
}


/* =========================================
   STOP MANTRA
========================================= */

function stopMantra() {

    keepListening = false;

    restarting = false;


    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }


    isListening = false;


    startBtn.disabled = false;

    stopBtn.disabled = true;


    statusDisplay.innerText =
        "⏹️ జపం ఆపబడింది";
}


/* =========================================
   ADD COUNT
========================================= */

function addCount() {

    if (count >= target) {
        return;
    }


    count++;


    countDisplay.innerText =
        count;


    const percentage =
        Math.min(
            (count / target) * 100,
            100
        );


    progressBar.style.width =
        percentage + "%";


    /*
       Mobile vibration
    */

    if (navigator.vibrate) {

        navigator.vibrate(60);
    }


    /*
       Target complete
    */

    if (count >= target) {

        completeJapam();
    }
}


/* =========================================
   COMPLETE
========================================= */

function completeJapam() {

    keepListening = false;


    /*
       Recognition stop
    */

    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }


    isListening = false;


    startBtn.disabled = false;

    stopBtn.disabled = true;


    completeCard.style.display =
        "block";


    completeMessage.innerText =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.innerText =
        "🎉 జపం పూర్తయింది";


    if (navigator.vibrate) {

        navigator.vibrate([
            300,
            150,
            300
        ]);
    }
}


/* =========================================
   TARGET BUTTONS
========================================= */

function setTarget(value) {

    targetInput.value =
        value;


    resetJapam();
}


/* =========================================
   RESET
========================================= */

function resetJapam() {

    stopMantra();


    count = 0;


    target =
        parseInt(
            targetInput.value
        ) || 108;


    countDisplay.innerText =
        "0";


    targetDisplay.innerText =
        target;


    progressBar.style.width =
        "0%";


    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    completeCard.style.display =
        "none";
}


/* =========================================
   TARGET CHANGE
========================================= */

targetInput.addEventListener(
    "change",
    function () {

        resetJapam();

    }
);
