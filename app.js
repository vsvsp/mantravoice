let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let shouldListen = false;

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


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition support లేదు.";

} else {

    recognition =
        new SpeechRecognition();

    recognition.lang = "te-IN";

    recognition.continuous = true;

    recognition.interimResults = false;


    recognition.onstart = function () {

        listening = true;

        startBtn.disabled = true;

        stopBtn.disabled = false;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రం పలకండి";
    };


    recognition.onresult = function (event) {

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            if (
                !event.results[i].isFinal
            ) {
                continue;
            }


            const spoken =
                event.results[i][0]
                .transcript
                .trim();


            if (!spoken) {
                continue;
            }


            recognizedText.innerText =
                spoken;


            /*
             * ప్రతి recognized phrase
             * ఒక జపంగా count అవుతుంది.
             */

            addCount();


            if (count < target) {

                statusDisplay.innerText =
                    "🙏 జపం గుర్తించబడింది — " +
                    count;
            }
        }
    };


    recognition.onerror =
        function (event) {

            console.log(
                "Voice Error:",
                event.error
            );


            /*
             * కొన్ని చిన్న errorsకి
             * listening కొనసాగుతుంది.
             */

            if (
                event.error ===
                "not-allowed"
            ) {

                shouldListen = false;

                listening = false;

                startBtn.disabled = false;

                stopBtn.disabled = true;

                statusDisplay.innerText =
                    "🎤 Microphone permission ఇవ్వండి";

                return;
            }


            statusDisplay.innerText =
                "🎤 మళ్లీ వింటున్నాను...";
        };


    recognition.onend =
        function () {

            listening = false;


            /*
             * User Stop నొక్కకపోతే
             * recognition automatically restart.
             */

            if (
                shouldListen &&
                count < target
            ) {

                setTimeout(
                    startRecognition,
                    300
                );

            } else {

                startBtn.disabled = false;

                stopBtn.disabled = true;
            }
        };
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
        ) || 108;


    targetDisplay.innerText =
        target;


    completeCard.style.display =
        "none";


    shouldListen = true;


    startRecognition();
}


/* =========================
   START RECOGNITION
========================= */

function startRecognition() {

    if (
        !recognition ||
        listening ||
        !shouldListen
    ) {
        return;
    }


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition start:",
            error
        );
    }
}


/* =========================
   STOP
========================= */

function stopMantra() {

    shouldListen = false;

    listening = false;


    if (recognition) {

        try {

            recognition.stop();

        } catch (error) {

            console.log(error);
        }
    }


    startBtn.disabled = false;

    stopBtn.disabled = true;


    statusDisplay.innerText =
        "⏹️ జపం ఆపబడింది";
}


/* =========================
   COUNT
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

    shouldListen = false;

    stopMantra();


    completeCard.style.display =
        "block";


    completeMessage.innerText =
        target +
        " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.innerText =
        "🎉 జపం పూర్తయింది";
}


/* =========================
   TARGET
========================= */

function setTarget(value) {

    targetInput.value =
        value;


    resetJapam();
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


targetInput.addEventListener(
    "change",
    function () {

        resetJapam();

    }
);
