let count = 0;
let target = 1100;

let recognition = null;
let isListening = false;
let keepListening = false;
let restarting = false;

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


/* =====================================
   VOICE RECOGNITION
===================================== */

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    statusDisplay.innerText =
        "❌ Chromeలో Voice Recognition support లేదు.";

} else {

    createRecognition();
}


/* =====================================
   CREATE RECOGNITION
===================================== */

function createRecognition() {

    recognition = new SpeechRecognition();

    recognition.lang = "te-IN";

    /*
       ప్రతి speech result తర్వాత
       session ముగుస్తుంది.
       onendలో automatic restart.
    */

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
            event.results[0][0]
            .transcript
            .trim();


        if (!spoken) {
            return;
        }


        recognizedText.innerText =
            spoken;


        /*
           ఎంత సార్లు పూర్తి మంత్రం
           వచ్చింది అనేది check.
        */

        const mantra =
            normalizeText(
                mantraInput.value
            );


        const speech =
            normalizeText(
                spoken
            );


        const matchedCount =
            countCompleteMantras(
                speech,
                mantra
            );


        console.log("Speech:", speech);
        console.log("Mantra:", mantra);
        console.log("Matched:", matchedCount);


        if (matchedCount > 0) {

            for (
                let i = 0;
                i < matchedCount;
                i++
            ) {

                addCount();

                if (count >= target) {
                    break;
                }
            }


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


    recognition.onerror =
        function (event) {

            console.log(
                "Voice error:",
                event.error
            );

            isListening = false;


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


    recognition.onend =
        function () {

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


/* =====================================
   TEXT NORMALIZATION
===================================== */

function normalizeText(text) {

    return text
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =====================================
   COUNT COMPLETE MANTRAS
===================================== */

function countCompleteMantras(
    speech,
    mantra
) {

    if (!speech || !mantra) {
        return 0;
    }


    /*
       Exact mantra మాత్రమే
       గుర్తించడానికి words array.
    */

    const speechWords =
        speech
            .split(" ")
            .filter(Boolean);


    const mantraWords =
        mantra
            .split(" ")
            .filter(Boolean);


    if (
        speechWords.length === 0 ||
        mantraWords.length === 0
    ) {
        return 0;
    }


    let matches = 0;


    /*
       Speechలో mantra words
       EXACT ORDERలో ఉన్నాయా?
    */

    for (
        let i = 0;
        i <= speechWords.length - mantraWords.length;
        i++
    ) {

        let complete = true;


        for (
            let j = 0;
            j < mantraWords.length;
            j++
        ) {

            if (
                speechWords[i + j] !==
                mantraWords[j]
            ) {

                complete = false;

                break;
            }
        }


        if (complete) {

            matches++;

            /*
               ఒకే wordsను మళ్లీ
               ఉపయోగించకుండా ముందుకు వెళ్తాం.
            */

            i += mantraWords.length - 1;
        }
    }


    return matches;
}


/* =====================================
   RESTART
===================================== */

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


/* =====================================
   START
===================================== */

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

        console.log(error);

        restartRecognition();
    }
}


/* =====================================
   STOP
===================================== */

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


/* =====================================
   ADD COUNT
===================================== */

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


/* =====================================
   COMPLETE
===================================== */

function completeJapam() {

    keepListening = false;


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


/* =====================================
   TARGET
===================================== */

function setTarget(value) {

    targetInput.value =
        value;

    resetJapam();
}


/* =====================================
   RESET
===================================== */

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


/* =====================================
   TARGET CHANGE
===================================== */

targetInput.addEventListener(
    "change",
    resetJapam
);
