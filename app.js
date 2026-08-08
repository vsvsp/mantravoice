let count = 0;
let target = 1100;

let recognition = null;
let listening = false;
let keepListening = false;
let restarting = false;

let lastProcessedSpeech = "";
let lastProcessedTime = 0;


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
   INITIALIZE
========================= */

count = 0;

localStorage.removeItem("mantraCount");

target =
    parseInt(targetInput.value) || 1100;

countDisplay.innerText = "0";

targetDisplay.innerText = target;

progressBar.style.width = "0%";


/* =========================
   TEXT NORMALIZATION
========================= */

function cleanText(text) {

    return String(text || "")
        .toLowerCase()
        .replace(/[.,!?;:"'`।]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}


/*
   Spaces completely remove.
   
   ఉదాహరణ:

   ఓం నమఃశివాయ
   ఓం నమః శివాయ

   రెండూ sameగా మారతాయి.
*/

function compactText(text) {

    return cleanText(text)
        .replace(/\s+/g, "");
}


/* =========================
   TELUGU WORD NORMALIZATION
========================= */

function normalizeWords(text) {

    return cleanText(text)
        .split(/\s+/)
        .filter(function(word) {

            return word.length > 0;

        });
}


/* =========================
   MANTRA MATCHING
========================= */

function isMantraMatch(
    mantra,
    voice
) {

    if (!mantra || !voice) {
        return false;
    }


    const targetCompact =
        compactText(mantra);

    const voiceCompact =
        compactText(voice);


    if (
        !targetCompact ||
        !voiceCompact
    ) {

        return false;
    }


    /*
      1. Exact match
    */

    if (
        targetCompact ===
        voiceCompact
    ) {

        return true;
    }


    /*
      2. Voice recognition sometimes
         changes spaces between Telugu words.

         Example:

         ఓం నమఃశివాయ
         ఓం నమః శివాయ
    */

    const targetWords =
        normalizeWords(mantra);

    const voiceWords =
        normalizeWords(voice);


    /*
      Compare word combinations.
    */

    const targetJoined =
        targetWords.join("");

    const voiceJoined =
        voiceWords.join("");


    if (
        targetJoined ===
        voiceJoined
    ) {

        return true;
    }


    /*
      3. Small recognition differences.
      
      Every important word should appear.
    */

    let matchedWords = 0;


    for (
        let i = 0;
        i < targetWords.length;
        i++
    ) {

        const targetWord =
            targetWords[i];


        let found = false;


        for (
            let j = 0;
            j < voiceWords.length;
            j++
        ) {

            const voiceWord =
                voiceWords[j];


            if (
                targetWord ===
                voiceWord
            ) {

                found = true;
                break;
            }


            /*
              One word may have been
              joined/split by recognition.
            */

            if (
                voiceCompact.includes(
                    targetWord
                )
            ) {

                found = true;
                break;
            }
        }


        if (found) {

            matchedWords++;
        }
    }


    /*
      Short mantra:
      all words must match.
    */

    if (targetWords.length <= 2) {

        return (
            matchedWords ===
            targetWords.length
        );
    }


    /*
      Longer mantra:
      at least 75% words match.
    */

    return (
        matchedWords /
        targetWords.length
        >= 0.75
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


    /*
      Start
    */

    recognition.onstart =
        function() {

            listening = true;

            restarting = false;

            startBtn.disabled = true;

            stopBtn.disabled = false;

            statusDisplay.innerText =
                "🎤 వింటున్నాను... మంత్రం పలకండి";
        };


    /*
      Result
    */

    recognition.onresult =
        function(event) {

            const spoken =
                event.results[0][0]
                .transcript
                .trim();


            if (!spoken) {
                return;
            }


            /*
              Show recognized voice
            */

            recognizedText.innerText =
                spoken;


            /*
              Prevent duplicate result
            */

            const now =
                Date.now();


            if (
                spoken ===
                lastProcessedSpeech
                &&
                now -
                lastProcessedTime
                < 1500
            ) {

                return;
            }


            lastProcessedSpeech =
                spoken;

            lastProcessedTime =
                now;


            const mantra =
                mantraInput.value.trim();


            if (!mantra) {

                statusDisplay.innerText =
                    "⚠️ ముందుగా మంత్రాన్ని టైప్ చేయండి";

                return;
            }


            console.log(
                "MANTRA:",
                mantra
            );


            console.log(
                "VOICE:",
                spoken
            );


            /*
              Check mantra
            */

            const matched =
                isMantraMatch(
                    mantra,
                    spoken
                );


            if (matched) {

                addCount();


                statusDisplay.innerText =
                    "🙏 మంత్రం గుర్తించబడింది — Count " +
                    count;

            } else {

                statusDisplay.innerText =
                    "🔎 మంత్రం సరిపోలలేదు — Count మారలేదు";
            }
        };


    /*
      Error
    */

    recognition.onerror =
        function(event) {

            console.log(
                "Speech error:",
                event.error
            );


            listening = false;


            if (
                event.error ===
                "not-allowed"
                ||
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


    /*
      End
    */

    recognition.onend =
        function() {

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
        function() {

            if (!keepListening) {

                restarting = false;

                return;
            }


            try {

                createRecognition();

                recognition.start();

            } catch(error) {

                console.log(
                    "Restart error:",
                    error
                );


                restarting = false;


                setTimeout(
                    restartRecognition,
                    600
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


    keepListening = true;


    completeCard.style.display =
        "none";


    /*
      New session duplicate protection
    */

    lastProcessedSpeech = "";

    lastProcessedTime = 0;


    try {

        recognition.start();

    } catch(error) {

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

        } catch(error) {

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


    /*
      Save
    */

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


    /*
      Vibration
    */

    if (
        navigator.vibrate
    ) {

        navigator.vibrate(60);
    }


    /*
      Target reached
    */

    if (
        count >= target
    ) {

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

        } catch(error) {

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


    if (
        navigator.vibrate
    ) {

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
   TARGET CHANGE
========================= */

targetInput.addEventListener(
    "change",
    function() {

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
    function() {

        /*
          New mantra =
          new counting session
        */

        resetJapam();


        localStorage.setItem(
            "mantraText",
            mantraInput.value
        );
    }
);
