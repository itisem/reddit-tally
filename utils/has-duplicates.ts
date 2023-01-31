import isDuplicate from "./is-duplicate";

type Reorderings = {[key: string]: string[]}

/** checks if a new entry is a duplicate of any previous entries 
 * @param {string[]} entries - all entries the current submission
 * @param {Reorderings} reorderings - all possible reorderings of (at least current) submissions
 * @param {errorThreshold} - how many typos should be considered?
 */
export default function hasDuplicates(entries: string[], reorderings: Reorderings, errorThreshold: number = 0): boolean{
	for(let i = 0; i < entries.length; i++){
		for(let j = 0; j < i; j ++){
			const allOrders = reorderings[entries[i]];
			const previousEntry = entries[j];
			// could maybe speed this up by not checking distance if threshold is 0?
			if(isDuplicate(allOrders, previousEntry, errorThreshold)) return true;
		}
	}
	return false;
}