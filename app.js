let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;


/* =========================
   ELEMENTS
========================= */

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


/* =========================
   NORMALIZE
========================= */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================
   REMOVE SPACES
========================= */

function compactText(text) {

    return cleanText(text)
        .replace(/\s+/g, "");
}


/* =========================
   CLEAR OLD COUNT
========================= */

/*
   IMPORTANT:
   Old saved count is cleared
   when this new app starts.
*/

localStorage.removeItem("mantraCount");

count = 0;

countDisplay.innerText = "0";


/* =========================
   TARGET
========================= */

target =
    parseInt(targetInput.value) || 1100;

targetDisplay.innerText =
    target;


/* =========================
   TARGET CHANGE
========================= */

targetInput.addEventListener(
    "change",
    function () {

        target =
            parseInt(
                targetInput.value
            ) || 1100;

        targetDisplay.innerText =
            target;

        resetCount();

    }
);


/* =========================
   MANTRA CHANGE
========================= */

mantraInput.addEventListener(
    "input",
    function () {

        /*
           New mantra = new count
        */

        resetCount();

        localStorage.setItem(
            "mantraText",
            mantraInput.value
        );
    }
);


/* =========================
   RESET COUNT
========================= */

function resetCount() {

    count = 0;

    countDisplay.innerText =
        "0";

    progressBar.style.width =
        "0%";

    localStorage.removeItem(
        "mantraCount"
    );

    completeCard.style.display =
        "none";
}


/* =========================
   SPEECH RECOGNITION
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

    recognition.continuous =
        false;

    recognition.interimResults =
        false;


    /* =====================
       START
    ===================== */

    recognition.onstart =
        function () {

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
        function (event) {

            const spoken =
                event.results[0][0]
                .transcript
                .trim();


            if (!spoken) {
                return;
            }


            recognizedText.innerText =
                spoken;


            const mantra =
                compactText(
                    mantraInput.value
                );


            const voice =
                compactText(
                    spoken
                );


            console.log(
                "Mantra:",
                mantra
            );

            console.log(
                "Voice:",
                voice
            );


            if (!mantra) {

                statusDisplay.innerText =
                    "⚠️ ముందుగా మంత్రాన్ని టైప్ చేయండి";

                return;
            }


            /*
              EXACT MATCH

              ఓం నమఃశివాయ
              ఓం నమః శివాయ

              spaces తీసేసిన తర్వాత
              రెండూ ఒకటే.
            */

            if (
                mantra === voice
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
        function (event) {

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

                keepListening = false;

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
        function () {

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


    try {

        recognition.start();

    } catch (error) {

        console.log(
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

        } catch (error) {

            console.log(
                error
            );
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


    const percentage =
        Math.min(
            (count / target) * 100,
            100
        );


    progressBar.style.width =
        percentage + "%";


    localStorage.setItem(
        "mantraCount",
        String(count)
    );


    if (navigator.vibrate) {

        navigator.vibrate(60);
    }


    if (count >= target) {

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

        } catch (error) {

            console.log(
                error
            );
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


    if (navigator.vibrate) {

        navigator.vibrate([
            300,
            150,
            300
        ]);
    }
}


/* =========================
   RESET BUTTON
========================= */

function resetJapam() {

    stopMantra();

    resetCount();

    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";

    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";
}


/* =========================
   SET TARGET
========================= */

function setTarget(value) {

    targetInput.value =
        value;

    target =
        value;

    targetDisplay.innerText =
        target;

    resetCount();
}
