let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;

let lastMantra = "";


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

function normalize(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================
   MANTRA KEY
========================= */

function mantraKey(text) {

    return normalize(text)
        .replace(/\s+/g, "");
}


/* =========================
   RESET COUNT
========================= */

function resetCountOnly() {

    count = 0;

    countDisplay.innerText = "0";

    progressBar.style.width = "0%";

    localStorage.setItem(
        "mantraCount",
        "0"
    );
}


/* =========================
   MANTRA CHANGE
========================= */

if (mantraInput) {

    mantraInput.addEventListener(
        "input",
        function () {

            const current =
                mantraKey(
                    mantraInput.value
                );

            if (
                current !== lastMantra
            ) {

                count = 0;

                countDisplay.innerText =
                    "0";

                progressBar.style.width =
                    "0%";

                localStorage.setItem(
                    "mantraCount",
                    "0"
                );

                localStorage.setItem(
                    "mantraText",
                    mantraInput.value
                );

                lastMantra =
                    current;

                statusDisplay.innerText =
                    "🕉️ కొత్త మంత్రం సిద్ధంగా ఉంది";
            }
        }
    );
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
   CREATE
========================= */

function createRecognition() {

    recognition =
        new SpeechRecognition();

    recognition.lang = "te-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart =
        function () {

            listening = true;

            restarting = false;

            startBtn.disabled = true;

            stopBtn.disabled = false;

            statusDisplay.innerText =
                "🎤 వింటున్నాను... మంత్రం పలకండి";
        };


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
                normalize(
                    mantraInput.value
                );


            const speech =
                normalize(
                    spoken
                );


            if (!mantra) {

                statusDisplay.innerText =
                    "⚠️ ముందుగా మంత్రాన్ని టైప్ చేయండి";

                return;
            }


            /*
              Spaces మాత్రమే ignore చేస్తాం.

              ఓం నమఃశివాయ
              ఓం నమః శివాయ

              రెండూ same అవుతాయి.
            */

            const targetText =
                mantraKey(
                    mantra
                );


            const spokenText =
                mantraKey(
                    speech
                );


            console.log(
                "MANTRA:",
                targetText
            );

            console.log(
                "VOICE:",
                spokenText
            );


            /*
              Exact mantra match
            */

            if (
                targetText ===
                spokenText
            ) {

                addCount();

                statusDisplay.innerText =
                    "🙏 మంత్రం గుర్తించబడింది — Count " +
                    count;

            } else {

                statusDisplay.innerText =
                    "🔎 మంత్రం సరిపోలలేదు";
            }
        };


    recognition.onerror =
        function (event) {

            console.log(
                "Voice Error:",
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

                startBtn.disabled = false;

                stopBtn.disabled = true;

                statusDisplay.innerText =
                    "🎤 Microphone permission ఇవ్వండి";

                return;
            }


            if (keepListening) {

                restartRecognition();
            }
        };


    recognition.onend =
        function () {

            listening = false;


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


/* =========================
   AUTO RESTART
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

                console.log(error);

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
   START
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


    completeCard.style.display =
        "none";


    keepListening = true;


    try {

        recognition.start();

    } catch (error) {

        console.log(error);

        restartRecognition();
    }
}


/* =========================
   STOP
========================= */

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


    listening = false;

    startBtn.disabled = false;

    stopBtn.disabled = true;


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


    localStorage.setItem(
        "mantraText",
        mantraInput.value
    );


    localStorage.setItem(
        "mantraTarget",
        String(target)
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

    keepListening = false;


    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }


    listening = false;

    startBtn.disabled = false;

    stopBtn.disabled = true;


    completeCard.style.display =
        "block";


    completeMessage.innerText =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.innerText =
        "🎉 జపం పూర్తయింది";
}


/* =========================
   RESET
========================= */

function resetJapam() {

    stopMantra();


    count = 0;


    target =
        parseInt(
            targetInput.value
        ) || 1100;


    countDisplay.innerText =
        "0";


    targetDisplay.innerText =
        target;


    progressBar.style.width =
        "0%";


    localStorage.setItem(
        "mantraCount",
        "0"
    );


    localStorage.setItem(
        "mantraTarget",
        String(target)
    );


    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    completeCard.style.display =
        "none";
}


/* =========================
   SET TARGET
========================= */

function setTarget(value) {

    targetInput.value =
        value;

    resetJapam();
}


/* =========================
   LOAD
========================= */

function loadSavedData() {

    const savedCount =
        localStorage.getItem(
            "mantraCount"
        );


    const savedMantra =
        localStorage.getItem(
            "mantraText"
        );


    const savedTarget =
        localStorage.getItem(
            "mantraTarget"
        );


    if (savedMantra) {

        mantraInput.value =
            savedMantra;
    }


    if (savedTarget) {

        target =
            parseInt(
                savedTarget
            ) || 1100;

        targetInput.value =
            target;
    }


    /*
      Saved count
    */

    count =
        parseInt(
            savedCount
        ) || 0;


    /*
      Display
    */

    countDisplay.innerText =
        count;


    targetDisplay.innerText =
        target;


    const percentage =
        Math.min(
            (count / target) * 100,
            100
        );


    progressBar.style.width =
        percentage + "%";


    lastMantra =
        mantraKey(
            mantraInput.value
        );
}


/* =========================
   LOAD APP
========================= */

loadSavedData();
