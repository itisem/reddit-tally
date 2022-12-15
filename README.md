# reddit-tally

This repository contains the source code for [reddit-tally.emily.bz](https://reddit-tally.emily.bz), a tool built to tally votes from voting threads on reddit. This tool was built with reducing manual workload in mind, and as such, does a fair bit of work to take care of quirks in user input, such as:

 * handling accented letters (e.g. "Córdoba" and "Cordoba" count as the same entry)
 * handling non-latin alphabets\* (e.g. "Новосибирск" and "Novosibirsk" count as the same entry)
 * handling capitalisation and punctuation (e.g. "saint louis du haha" and "Saint-Louis-du-Ha! Ha!" count as the same entry)
 * (optionally) handling artist - title vs. title - artist order for music (e.g. "Natalia Lafourcade - Hasta La Raíz" and "Hasta La Raíz - Natalia Lafourcade" count as the same entry)
 * (optionally) fixing typos (e.g. "Charli XCX - Vroom Vroom" and "Charli CXX - Vroom Vroom" count as the same entry)

 \* note: the success of automatically transcribing non-latin alphabets varies wildly. Cyrillic, hangul and hiragana are generally fine, but kanji may still cause issues.