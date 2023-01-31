import unidecode from "unidecode";
import type {ListType} from "../types";

/** removes various spelling quirks from entries to ensure consistent parsing
 * @param {string} entry - the currently parsed entry
 * @param {ListType} listType - "artistTitle" for "artist - title" lists, "raw" for any other. determines how hyphens are handled
 */
export default function normalise(entry: string, listType: ListType = "raw"): string{
	let s = unidecode(entry); // will produce weird results for languages like Japanese, but it's only used in the background, not in display
	s = s.toLowerCase();
	s = s.replaceAll("&", " ").replaceAll(/\band\b/gu, " ").replaceAll(/\bthe\b/gu, " ");
	if(listType === "artistTitle"){
		s = s.replaceAll(/[^0-9a-z\-]/g, "");
		s = s.replaceAll("—", "-").replaceAll("-", " - ").replaceAll(/( - )+/gu, " - ");
	}
	else{
		s = s.replaceAll(/[^0-9a-z]/g, "");
	}
	s = s.trim();
	return s;
}