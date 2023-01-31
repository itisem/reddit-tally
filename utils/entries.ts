import isDuplicate from "./is-duplicate";

type EntryStats = {
	points: number,
	lists: number,
	variants: {[key: string]: EntryVariant},
	discarded: boolean
};

type EntryVariant = {
	points: number,
	lists: number
};

type EntryName = {
	real: string,
	normal: string
};

class Entries{
	entries: {[key: string]: EntryStats};
	constructor(){
		this.entries = {};
	}

	/** adds an entry
	 * @param {EntryName} entry - the real entry, as well as its normalised form
	 * @param {number} points - how many points to add
	 */
	add(entry: EntryName, points: number){
		if(!this.entries[entry.normal]){
			this.entries[entry.normal] = {
				points: 0,
				lists: 0,
				variants: {},
				discarded: false
			};
		}
		let currentItem = this.entries[entry.normal];
		if(!currentItem.variants[entry.real]){
			currentItem.variants[entry.real] = {
				points: 0,
				lists: 0
			}
		}
		currentItem.points += points;
		currentItem.variants[entry.real].points += points;
		currentItem.lists += 1;
		currentItem.variants[entry.real].lists += 1;
	}

	/** sorts the entries by number of points */
	sort(){
		this.entries = Object.fromEntries(Object.entries(this.entries).sort(([,a],[,b]) => b.points - a.points));
	}

	/** fixes duplicates
	 * @param {[key: string]: string[]} reorderings - all the possible reorderings of each entry
	 * @param {number} threshold - how many typos are acceptable before 2 words are different
	 */
	fixDuplicates(reorderings: {[key: string]: string[]}, threshold: number){
		const names = Object.keys(this.entries);
		for(let i = 0; i < names.length; i++){ // gets rid of typo-based duplicates
			let foundDuplicate = false;
			let j = 0;
			while(j < i && !foundDuplicate){
				if(!this.entries[names[j]].discarded && isDuplicate(reorderings[names[i]], names[j], threshold)){
					let ej = this.entries[names[j]];
					let ei = this.entries[names[i]];
					ej.points += ei.points;
					ej.lists += ei.lists;
					ej.variants = {...ej.variants, ...ei.variants};
					ei.discarded = true;
					foundDuplicate = true;
				}
				j += 1;
			}
		}
		this.entries = Object.fromEntries(Object.entries(this.entries).filter(x => !x[1].discarded));
	}
}


export default Entries;