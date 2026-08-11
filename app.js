function isMantraMatch(spoken) {

    const mantra = cleanText(mantraInput.value);
    const voice = cleanText(spoken);

    if (!mantra || !voice) {
        return false;
    }

    // Exact match
    if (voice === mantra) {
        return true;
    }

    // Space లేకుండా match
    if (compactText(voice) === compactText(mantra)) {
        return true;
    }

    // Common Telugu pronunciation variations
    const variations = [
        "ఓం నమఃశివాయ",
        "ఓం నమ శివాయ",
        "ఓం నమశ్శివాయ",
        "ఓం నమః శివాయ",
        "ఓం నమ శివాయ",
        "ఓం నమశివాయ",
        "ఓం నమఃశివాయ నమః"
    ];

    const compactVoice = compactText(voice);

    for (const word of variations) {

        if (
            compactVoice.includes(
                compactText(word)
            )
        ) {
            return true;
        }

    }

    // Word based matching
    const targetWords =
        mantra.split(" ").filter(Boolean);

    const spokenWords =
        voice.split(" ").filter(Boolean);

    let matched = 0;

    for (const targetWord of targetWords) {

        for (const spokenWord of spokenWords) {

            if (
                spokenWord === targetWord
            ) {
                matched++;
                break;
            }

            if (
                spokenWord.length >= 2 &&
                targetWord.length >= 2 &&
                (
                    spokenWord.includes(targetWord) ||
                    targetWord.includes(spokenWord)
                )
            ) {
                matched++;
                break;
            }
        }
    }

    return (
        targetWords.length > 0 &&
        matched / targetWords.length >= 0.60
    );
}
