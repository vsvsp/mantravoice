let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;


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
   INITIAL RESET
========================= */

count = 0;

localStorage.removeItem("mantraCount");

countDisplay.innerText = "0";

target =
    parseInt(targetInput.value) || 1100;

targetDisplay.innerText =
    target;


/* =========================
   TEXT CLEAN
========================= */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/* =========================
   COMPACT TEXT
========================= */

function compactText(text) {

    return cleanText(text)
        .replace(/\s+/g, "");
}


/* =========================
   MANTRA MATCH
========================= */

function isMantraMatch(
    mantra,
    voice
) {

    if (!mantra || !voice) {
        return false;
    }


    const a =
        compactText(mantra);

    const b =
        compactText(voice);


    if (!a || !b) {
        return false;
    }


    /* Exact */

    if (a === b) {
        return true;
    }


    /*
      Speech recognitionలో
      చిన్న spelling difference
    */

    const distance =
        levenshteinDistance(a, b);


    const maxLength =
        Math.max(
            a.length,
            b.length
        );


    if (maxLength === 0) {
        return false;
    }


    const similarity =
        1 -
        (
            distance /
            maxLength
        );


    /*
      80% పైగా match
    */

    if (similarity >= 0.80) {
        return true;
    }


    return false;
}


/* =========================
   LEVENSHTEIN
========================= */

function levenshteinDistance(
    a,
    b
) {

    const matrix = [];


    for (
        let i = 0;
        i <= b.length;
        i++
    ) {

        matrix[i] = [i];
    }


    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        matrix[0][j] = j;
    }


    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            if (
                b.charAt(i - 1) ===
                a.charAt(j - 1)
            ) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] =
                    Math.min(

                        matrix[i - 1][j - 1] + 1,

                        matrix[i][j - 1] + 1,

                        matrix[i - 1][j] + 1
                    );
            }
        }
    }


    return matrix[b.length][a.length];
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
       ON START
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
       ON RESULT
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


            /*
              User చెప్పిన మాట display
            */

            recognizedText.innerText =
                spoken;


            const mantra =
                mantraInput.value
                .trim();


            if (!mantra) {

                statusDisplay.innerText =
                    "⚠️ ముందుగా మంత్రాన్ని టైప్ చేయండి";

                return;
            }


            console.log(
                "Typed mantra:",
                mantra
            );


            console.log(
                "Recognized voice:",
                spoken
            );


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
       ON END
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


    /*
      Save current count
    */

    localStorage.setItem(
        "mantraCount",
        String(count)
    );


    /*
      Save mantra
    */

    localStorage.setItem(
        "mantraText",
        mantraInput.value
    );


    /*
      Save target
    */

    localStorage.setItem(
        "mantraTarget",
        String(target)
    );


    /*
      Vibration
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
   RESET
========================= */

function resetJapam() {

    stopMantra();


    count = 0;


    countDisplay.innerText =
        "0";


    progressBar.style.width =
        "0%";


    localStorage.removeItem(
        "mantraCount"
    );


    localStorage.removeItem(
        "mantraText"
    );


    completeCard.style.display =
        "none";


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


    resetJapam();
}


/* =========================
   TARGET INPUT
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
    }
);


/* =========================
   MANTRA CHANGE
========================= */

mantraInput.addEventListener(
    "change",
    function () {

        /*
          New mantra అయితే
          count 0
        */

        resetJapam();


        localStorage.setItem(
            "mantraText",
            mantraInput.value
        );
    }
);
