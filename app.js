let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;

let lastSpeech = "";
let lastSpeechTime = 0;


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   INITIAL
========================= */

count = 0;

target =
    parseInt(targetInput.value) || 1100;

countDisplay.innerText = "0";

targetDisplay.innerText =
    target;

progressBar.style.width = "0%";


/* =========================
   NORMALIZE TEXT
========================= */

function normalizeText(text) {

    return String(text || "")
        .trim()
        .replace(/\s+/g, "");
}


/* =========================
   MANTRA MATCH
========================= */

function isMantraMatch(
    mantra,
    voice
) {

    const a =
        normalizeText(mantra);

    const b =
        normalizeText(voice);


    console.log(
        "MANTRA =",
        a
    );

    console.log(
        "VOICE =",
        b
    );


    if (!a || !b) {
        return false;
    }


    /*
      Exact match after
      removing spaces
    */

    return a === b;
}


/* =========================
   SPEECH API
========================= */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition support లేదు.";

} else {

    createRecognition();
}


/* =========================
   CREATE RECOGNITION
========================= */

function createRecognition() {

    recognition =
        new SpeechRecognition();


    recognition.lang =
        "te-IN";


    /*
      ఒక్క result తీసుకుంటుంది.
      result వచ్చిన తర్వాత
      automaticగా కొత్త listening
      ప్రారంభమవుతుంది.
    */

    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    /* =====================
       START
    ===================== */

    recognition.onstart =
        function() {

            listening = true;

            restarting = false;

            startBtn.disabled =
                true;

            stopBtn.disabled =
                false;


            statusDisplay.innerText =
                "🎤 వింటున్నాను... మంత్రం పలకండి";
        };


    /* =====================
       RESULT
    ===================== */

    recognition.onresult =
        function(event) {

            const spoken =
                event.results[0][0]
                .transcript
                .trim();


            if (!spoken) {
                return;
            }


            /*
              Recognized text చూపించు
            */

            recognizedText.innerText =
                spoken;


            /*
              Duplicate protection
            */

            const now =
                Date.now();


            if (
                spoken === lastSpeech &&
                now - lastSpeechTime < 1200
            ) {

                return;
            }


            lastSpeech =
                spoken;

            lastSpeechTime =
                now;


            const mantra =
                mantraInput.value.trim();


            if (!mantra) {

                statusDisplay.innerText =
                    "⚠️ ముందుగా మంత్రాన్ని టైప్ చేయండి";

                return;
            }


            /*
              MATCH
            */

            if (
                isMantraMatch(
                    mantra,
                    spoken
                )
            ) {

                addCount();

                statusDisplay.innerText =
                    "🙏 మంత్రం గుర్తించబడింది — Count " +
                    count;

            } else {

                statusDisplay.innerText =
                    "🔎 మంత్రం సరిపోలలేదు — Count మారలేదు";
            }
        };


    /* =====================
       ERROR
    ===================== */

    recognition.onerror =
        function(event) {

            console.log(
                "Speech error:",
                event.error
            );


            listening = false;


            if (
                event.error ===
                "not-allowed" ||
                event.error ===
                "service-not-allowed"
            ) {

                keepListening =
                    false;


                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;


                statusDisplay.innerText =
                    "🎤 Microphone permission ఇవ్వండి";


                return;
            }


            if (keepListening) {

                restartRecognition();
            }
        };


    /* =====================
       END
    ===================== */

    recognition.onend =
        function() {

            listening = false;


            if (
                keepListening &&
                count < target
            ) {

                restartRecognition();

            } else {

                startBtn.disabled =
                    false;

                stopBtn.disabled =
                    true;
            }
        };
}


/* =========================
   RESTART
========================= */

function restartRecognition() {

    if (
        !keepListening ||
        listening ||
        restarting
    ) {

        return;
    }


    restarting = true;


    setTimeout(
        function() {

            if (!keepListening) {

                restarting = false;

                return;
            }


            try {

                /*
                  New recognition object
                */

                createRecognition();

                recognition.start();

            } catch(error) {

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
        500
    );
}


/* =========================
   START JAPAM
========================= */

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
        ) || 1100;


    targetDisplay.innerText =
        target;


    keepListening =
        true;


    completeCard.style.display =
        "none";


    lastSpeech =
        "";

    lastSpeechTime =
        0;


    try {

        recognition.start();

    } catch(error) {

        console.log(
            "Start error:",
            error
        );


        restartRecognition();
    }
}


/* =========================
   STOP
========================= */

function stopMantra() {

    keepListening =
        false;


    restarting =
        false;


    if (recognition) {

        try {

            recognition.stop();

        } catch(error) {

            console.log(error);
        }
    }


    listening =
        false;


    startBtn.disabled =
        false;


    stopBtn.disabled =
        true;


    statusDisplay.innerText =
        "⏹️ జపం ఆపబడింది";
}


/* =========================
   ADD COUNT
========================= */

function addCount() {

    if (count >= target) {

        return;
    }


    count++;


    countDisplay.innerText =
        count;


    /*
      Progress
    */

    const percentage =
        Math.min(
            (count / target) * 100,
            100
        );


    progressBar.style.width =
        percentage + "%";


    /*
      Phone vibration
    */

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(60);
    }


    /*
      Target complete
    */

    if (
        count >= target
    ) {

        completeJapam();
    }
}


/* =========================
   COMPLETE
========================= */

function completeJapam() {

    keepListening =
        false;


    if (recognition) {

        try {

            recognition.stop();

        } catch(error) {

            console.log(error);
        }
    }


    listening =
        false;


    startBtn.disabled =
        false;


    stopBtn.disabled =
        true;


    completeCard.style.display =
        "block";


    completeMessage.innerText =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.innerText =
        "🎉 జపం పూర్తయింది";


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


/* =========================
   RESET
========================= */

function resetJapam() {

    stopMantra();


    count = 0;


    countDisplay.innerText =
        "0";


    progressBar.style.width =
        "0%";


    completeCard.style.display =
        "none";


    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";
}


/* =========================
   TARGET BUTTON
========================= */

function setTarget(value) {

    targetInput.value =
        value;


    target =
        value;


    targetDisplay.innerText =
        target;


    resetJapam();
}


/* =========================
   TARGET CHANGE
========================= */

targetInput.addEventListener(
    "change",
    function() {

        target =
            parseInt(
                targetInput.value
            ) || 1100;


        targetDisplay.innerText =
            target;
    }
);


/* =========================
   MANTRA CHANGE
========================= */

mantraInput.addEventListener(
    "change",
    function() {

        /*
          కొత్త మంత్రం =
          కొత్త counting session
        */

        resetJapam();
    }
);
