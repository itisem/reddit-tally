import unidecode from "unidecode";
import type {ListType} from "./reorder";

/** removes various spelling quirks from entries to ensure consistent parsing
 * @param {string} entry - the currently parsed entry
 * @param {ListType} listType - "artistTitle" for "artist - title" lists, "raw" for any other. determines how hyphens are handled
 */
export default function normalise(entry: string, listType: ListType = "raw"): string{
	let s = unidecode(entry); // will produce weird results for languages like Japanese, but it's only used in the background, not in display
	// ideally, everything would get transcribed properly, but there is no library that handles every language well with auto-detection
	// so for now, imperfect transcriptions are good enough
	s = s.toLowerCase();
	// removing "and" and "the" since people often leave those out
	// if "the the" ever releases more music, i guess this can be removed, but it's good enough for now
	s = s.replaceAll("&", " ").replaceAll(/\band\b/gu, " ").replaceAll(/\bthe\b/gu, " ");
	if(listType === "artistTitle"){
		// removing non-alnum
		s = s.replaceAll(/[^0-9a-z\-]/g, "");
		// standardising dashes
		s = s.replaceAll("—", "-").replaceAll("-", " - ").replaceAll(/( - )+/gu, " - ");
	}
	else{
		s = s.replaceAll(/[^0-9a-z]/g, "");
	}
	s = s.trim();
	return s;
}