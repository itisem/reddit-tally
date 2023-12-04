import type {ListType} from "../types";
import range from "./range";

/** provides the possible reorderings of an entry (mainly used for "title - artist" entries counting the same as "artist - title" entries)
 * @param {string} entry - the entry to reorder
 * @param {ListType} listType - "artistTitle" for artist - title entries, "raw" for anything else
 */
export default function reorderings(entry: string, listType: ListType = "raw"): string[]{
	let reorderings = [];
	if(listType === "artistTitle"){
		// splits by " - " rather than "-" since previous utils will have already replaced everything with " - "
		const possibleSplits = entry.split(" - ");
		return range(possibleSplits.length).map(i => [...possibleSplits.slice(i), ...possibleSplits.slice(0, i)].join(" - "));
	}
	else{
		return [entry];
	}
}