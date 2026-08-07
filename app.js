let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;


/* ==============================
   ELEMENTS
============================== */

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


/* ==============================
   VOICE
============================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition support లేదు.";

} else {

    createRecognition();
}


/* ==============================
   CREATE RECOGNITION
============================== */

function createRecognition() {

    recognition = new SpeechRecognition();

    recognition.lang = "te-IN";

    recognition.continuous = false;

    recognition.interimResults = false;


    recognition.onstart = function () {

        listening = true;
        restarting = false;

        startBtn.disabled = true;
        stopBtn.disabled = false;

        statusDisplay.innerText =
            "🎤 వింటున్నాను... మంత్రం పలకండి";
    };


    recognition.onresult = function (event) {

        const spoken =
            event.results[0][0]
            .transcript
            .trim();


        if (!spoken) return;


        recognizedText.innerText =
            spoken;


        /*
          USER BOXలో ఏ మంత్రం టైప్ చేస్తే
          అదే target mantra.
        */

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


        const score =
            calculateScore(
                mantra,
                speech
            );


        console.log(
            "Typed Mantra:",
            mantra
        );

        console.log(
            "Voice:",
            speech
        );

        console.log(
            "Score:",
            score
        );


        /*
          80% match అయితే count
        */

        if (score >= 0.80) {

            addCount();

            if (count < target) {

                statusDisplay.innerText =
                    "🙏 మంత్రం గుర్తించబడింది — Count " +
                    count;
            }

        } else {

            statusDisplay.innerText =
                "🔎 మంత్రం కాదు — Count మారలేదు";
        }
    };


    recognition.onerror = function (event) {

        console.log(
            "Voice Error:",
            event.error
        );


        listening = false;


        if (
            event.error === "not-allowed" ||
            event.error === "service-not-allowed"
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


    recognition.onend = function () {

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


/* ==============================
   NORMALIZE
============================== */

function normalize(text) {

    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* ==============================
   MATCH
============================== */

function calculateScore(mantra, speech) {

    if (!mantra || !speech) {
        return 0;
    }


    /*
      Exact match
    */

    if (mantra === speech) {
        return 1;
    }


    const mantraWords =
        mantra
        .split(" ")
        .filter(Boolean);


    const speechWords =
        speech
        .split(" ")
        .filter(Boolean);


    if (
        speechWords.length <
        mantraWords.length
    ) {

        return 0;
    }


    let bestScore = 0;


    for (
        let start = 0;
        start <=
        speechWords.length -
        mantraWords.length;
        start++
    ) {

        let matched = 0;


        for (
            let i = 0;
            i < mantraWords.length;
            i++
        ) {

            const wanted =
                mantraWords[i];

            const spoken =
                speechWords[start + i];


            if (
                wordMatch(
                    wanted,
                    spoken
                )
            ) {

                matched++;
            }
        }


        const score =
            matched /
            mantraWords.length;


        if (score > bestScore) {

            bestScore = score;
        }
    }


    return bestScore;
}


/* ==============================
   WORD MATCH
============================== */

function wordMatch(wanted, spoken) {

    if (wanted === spoken) {
        return true;
    }


    /*
      Telugu speechలో చిన్న
      spelling/transcription difference
    */

    if (
        wanted.length >= 4 &&
        spoken.length >= 4
    ) {

        const wantedStart =
            wanted.substring(0, 4);

        const spokenStart =
            spoken.substring(0, 4);


        if (
            wantedStart === spokenStart
        ) {

            return true;
        }
    }


    return false;
}


/* ==============================
   AUTO RESTART
============================== */

function restartRecognition() {

    if (
        !keepListening ||
        listening ||
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

            console.log(error);

            restarting = false;

            setTimeout(
                restartRecognition,
                700
            );
        }

    }, 400);
}


/* ==============================
   START
============================== */

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


/* ==============================
   STOP
============================== */

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


/* ==============================
   COUNT + SAVE
============================== */

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
      Save count
    */

    localStorage.setItem(
        "mantraCount",
        count
    );


    if (navigator.vibrate) {

        navigator.vibrate(60);
    }


    if (count >= target) {

        completeJapam();
    }
}


/* ==============================
   COMPLETE
============================== */

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


    if (navigator.vibrate) {

        navigator.vibrate([
            300,
            150,
            300
        ]);
    }
}


/* ==============================
   TARGET
============================== */

function setTarget(value) {

    targetInput.value =
        value;


    resetJapam();
}


/* ==============================
   RESET
============================== */

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


    localStorage.removeItem(
        "mantraCount"
    );


    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    completeCard.style.display =
        "none";
}


/* ==============================
   LOAD SAVED COUNT
============================== */

function loadSavedData() {

    const savedCount =
        localStorage.getItem(
            "mantraCount"
        );


    if (savedCount !== null) {

        count =
            parseInt(
                savedCount
            ) || 0;
    }


    target =
        parseInt(
            targetInput.value
        ) || 1100;


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
}


/* ==============================
   LOAD
============================== */

loadSavedData();
