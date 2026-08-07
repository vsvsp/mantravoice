let count = 0;
let target = 1100;

let recognition = null;
let isListening = false;
let keepListening = false;
let restarting = false;

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

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition అందుబాటులో లేదు.";

} else {

    createRecognition();
}


function createRecognition() {

    recognition = new SpeechRecognition();

    recognition.lang = "te-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        isListening = true;
        restarting = false;

        startBtn.disabled = true;
        stopBtn.disabled = false;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రం పలకండి";
    };


    recognition.onresult = function (event) {

        const spoken =
            event.results[0][0].transcript.trim();


        if (!spoken) {
            return;
        }


        recognizedText.innerText =
            spoken;


        // Voice phrase = one count
        addCount();


        if (count < target) {

            statusDisplay.innerText =
                "🙏 గుర్తించబడింది — Count " +
                count;
        }
    };


    recognition.onerror = function (event) {

        console.log(
            "Speech error:",
            event.error
        );


        isListening = false;


        // Permission సమస్య అయితే restart చేయవద్దు
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


        if (keepListening) {

            restartRecognition();
        }
    };


    recognition.onend = function () {

        isListening = false;


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


function restartRecognition() {

    if (
        !keepListening ||
        isListening ||
        restarting
    ) {
        return;
    }


    restarting = true;


    setTimeout(function () {

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

    }, 400);
}


function startMantra() {

    if (!recognition) {

        alert(
            "ఈ browserలో Voice Recognition support లేదు."
        );

        return;
    }


    target =
        parseInt(targetInput.value) || 108;

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


function completeJapam() {

    keepListening = false;

    stopMantra();


    completeCard.style.display =
        "block";


    completeMessage.innerText =
        target + " జపాలు పూర్తయ్యాయి 🙏";


    statusDisplay.innerText =
        "🎉 జపం పూర్తయింది";
}


function setTarget(value) {

    targetInput.value = value;

    resetJapam();
}


function resetJapam() {

    stopMantra();


    count = 0;


    target =
        parseInt(targetInput.value) || 108;


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
    resetJapam
);
