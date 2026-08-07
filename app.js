let count = 0;
let target = 1100;
let recognition = null;
let listening = false;

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


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (SpeechRecognition) {

    recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.lang = "te-IN";


    recognition.onstart = function () {

        listening = true;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రాన్ని పలకండి";

        startBtn.disabled = true;
        stopBtn.disabled = false;
    };


    recognition.onresult = function (event) {

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            if (event.results[i].isFinal) {

                const text =
                    event.results[i][0].transcript.trim();

                recognizedText.innerText = text;

                checkMantra(text);
            }
        }
    };


    recognition.onerror = function (event) {

        console.log("Voice error:", event.error);

        statusDisplay.innerText =
            "⚠️ Voice error: " + event.error;

        listening = false;

        startBtn.disabled = false;
        stopBtn.disabled = true;
    };


    recognition.onend = function () {

        listening = false;

        startBtn.disabled = false;
        stopBtn.disabled = true;
    };
}


function normalizeText(text) {

    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


function checkMantra(spokenText) {

    const wanted =
        normalizeText(mantraInput.value);

    const spoken =
        normalizeText(spokenText);


    if (
        spoken.includes(wanted) ||
        wanted.includes(spoken)
    ) {

        addCount();

    } else {

        statusDisplay.innerText =
            "🔎 మంత్రం సరిపోలలేదు... మళ్లీ పలకండి";
    }
}


function startMantra() {

    if (!recognition) {

        alert(
            "ఈ browserలో Voice Recognition support లేదు. Chromeలో ప్రయత్నించండి."
        );

        return;
    }


    if (!mantraInput.value.trim()) {

        alert("ముందుగా మంత్రాన్ని నమోదు చేయండి.");

        return;
    }


    target =
        parseInt(targetInput.value) || 108;

    targetDisplay.innerText = target;

    completeCard.style.display = "none";


    try {

        recognition.start();

    } catch (error) {

        console.log(error);
    }
}


function stopMantra() {

    if (recognition && listening) {

        recognition.stop();
    }

    listening = false;

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

    countDisplay.innerText = count;


    let percentage =
        (count / target) * 100;

    if (percentage > 100) {
        percentage = 100;
    }


    progressBar.style.width =
        percentage + "%";


    statusDisplay.innerText =
        "🙏 మంత్రం గుర్తించబడింది";


    if (navigator.vibrate) {
        navigator.vibrate(60);
    }


    if (count >= target) {

        completeJapam();
    }
}


function completeJapam() {

    stopMantra();

    completeCard.style.display = "block";

    completeMessage.innerText =
        target + " జపాలు పూర్తయ్యాయి 🙏";

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


function setTarget(value) {

    targetInput.value = value;

    resetJapam();
}


function resetJapam() {

    stopMantra();

    count = 0;

    target =
        parseInt(targetInput.value) || 108;

    countDisplay.innerText = "0";

    targetDisplay.innerText = target;

    progressBar.style.width = "0%";

    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";

    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";

    completeCard.style.display = "none";
}


targetInput.addEventListener(
    "change",
    function () {

        target =
            parseInt(this.value) || 108;

        resetJapam();
    }
);
