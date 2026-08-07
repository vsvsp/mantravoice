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


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ ఈ browserలో Voice Recognition support లేదు.";

} else {

    recognition = new SpeechRecognition();

    recognition.continuous = true;

    recognition.interimResults = true;

    recognition.lang = "te-IN";


    recognition.onstart = function () {

        listening = true;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రం పలకండి";

        startBtn.disabled = true;

        stopBtn.disabled = false;
    };


    recognition.onresult = function (event) {

        let finalText = "";

        for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
        ) {

            const text =
                event.results[i][0].transcript;

            recognizedText.innerText = text;

            if (event.results[i].isFinal) {

                finalText += " " + text;
            }
        }


        finalText = finalText.trim();


        if (finalText !== "") {

            statusDisplay.innerText =
                "🎤 మీరు చెప్పింది: " + finalText;

            checkMantra(finalText);
        }
    };


    recognition.onerror = function (event) {

        console.log("Speech error:", event.error);

        statusDisplay.innerText =
            "⚠️ " + event.error;

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


/* Telugu speech comparison */

function normalizeText(text) {

    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, "")
        .trim();
}


function checkMantra(spokenText) {

    const wanted =
        normalizeText(mantraInput.value);

    const spoken =
        normalizeText(spokenText);


    console.log("Wanted:", wanted);

    console.log("Spoken:", spoken);


    /*
       మొదటి versionలో exact match ఉండేది.
       ఇప్పుడు mantraలోని ముఖ్యమైన పదాలు
       గుర్తిస్తే count అవుతుంది.
    */


    const words =
        mantraInput.value
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 1);


    let matched = 0;


    for (const word of words) {

        const cleanWord =
            normalizeText(word);


        if (spoken.includes(cleanWord)) {

            matched++;
        }
    }


    /*
       కనీసం 1 ముఖ్యమైన పదం గుర్తిస్తే
       count చేయడానికి అనుమతిస్తున్నాం.
    */

    if (
        matched >= 1 ||
        spoken.includes(wanted) ||
        wanted.includes(spoken)
    ) {

        addCount();

    } else {

        statusDisplay.innerText =
            "🔎 మంత్రం స్పష్టంగా వినిపించలేదు. మళ్లీ పలకండి.";
    }
}


/* Start */

function startMantra() {

    if (!recognition) {

        alert(
            "Chromeలో Voice Recognition support అవసరం."
        );

        return;
    }


    target =
        parseInt(targetInput.value) || 108;


    targetDisplay.innerText =
        target;


    completeCard.style.display =
        "none";


    try {

        recognition.start();

    } catch (error) {

        console.log(error);

    }
}


/* Stop */

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


/* Count */

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


    statusDisplay.innerText =
        "🙏 మంత్రం గుర్తించబడింది — Count " + count;


    if (navigator.vibrate) {

        navigator.vibrate(70);
    }


    if (count >= target) {

        completeJapam();
    }
}


/* Complete */

function completeJapam() {

    stopMantra();


    completeCard.style.display =
        "block";


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


/* Target */

function setTarget(value) {

    targetInput.value =
        value;

    resetJapam();
}


/* Reset */

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
    function () {

        resetJapam();

    }
);
