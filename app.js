let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;


/* ==============================
   ELEMENTS
============================== */

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


/* ==============================
   SPEECH RECOGNITION
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


            /*
              User టైప్ చేసిన మంత్రం
            */

            const mantra =
                normalize(
                    mantraInput.value
                );


            /*
              Voiceలో వచ్చిన text
            */

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
                "Match Score:",
                score
            );


            /*
              Match అయితే Count
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


    recognition.onerror =
        function (event) {

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
   MANTRA MATCHING
============================== */

function calculateScore(
    mantra,
    speech
) {

    if (!mantra || !speech) {
        return 0;
    }


    /*
      Spaces remove చేస్తాం.

      ఉదాహరణ:

      ఓం నమఃశివాయ

      ఓం నమః శివాయ

      రెండూ:

      ఓంనమఃశివాయ
    */

    const targetText =
        mantra
        .replace(/\s+/g, "")
        .trim();


    const spokenText =
        speech
        .replace(/\s+/g, "")
        .trim();


    /*
      Exact match
    */

    if (
        targetText ===
        spokenText
    ) {

        return 1;
    }


    /*
      Voice textలో target
      పూర్తిగా ఉంటే match
    */

    if (
        spokenText.includes(
            targetText
        )
    ) {

        return 1;
    }


    /*
      Target text voice textలో
      చిన్న differenceతో ఉంటే
      similarity check.
    */

    const distance =
        levenshteinDistance(
            targetText,
            spokenText
        );


    const maxLength =
        Math.max(
            targetText.length,
            spokenText.length
        );


    if (maxLength === 0) {
        return 1;
    }


    const score =
        1 -
        (
            distance /
            maxLength
        );


    return score;
}


/* ==============================
   LEVENSHTEIN DISTANCE
============================== */

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
        400
    );
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
   ADD COUNT
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
        target
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
   SET TARGET
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


    localStorage.removeItem(
        "mantraText"
    );


    localStorage.removeItem(
        "mantraTarget"
    );


    recognizedText.innerText =
        "Microphone ప్రారంభించిన తర్వాత మీ మాట ఇక్కడ కనిపిస్తుంది.";


    statusDisplay.innerText =
        "🎤 Start నొక్కి మంత్రం పలకండి";


    completeCard.style.display =
        "none";
}


/* ==============================
   LOAD SAVED DATA
============================== */

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


    /*
      Load count
    */

    if (savedCount !== null) {

        count =
            parseInt(
                savedCount
            ) || 0;
    }


    /*
      Load mantra
    */

    if (
        savedMantra !== null &&
        savedMantra.trim() !== ""
    ) {

        mantraInput.value =
            savedMantra;
    }


    /*
      Load target
    */

    if (savedTarget !== null) {

        target =
            parseInt(
                savedTarget
            ) || 1100;


        targetInput.value =
            target;
    }


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
