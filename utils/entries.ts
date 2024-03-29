import isDuplicate from "./is-duplicate";
import hasDuplicates from "./has-duplicates";
import reorder from "./reorder";

export interface EntriesOpts{
	typoThreshold: number;
	entryScoring: number[];	
}

export interface EntryStats{
	points: number,
	lists: number,
	variants: {[key: string]: EntryVariant},
	discarded: boolean
};

export interface EntryVariant{
	points: number,
	lists: number
};

export interface EntryName{
	real: string, // the actual entry, used for display
	normal: string // the normalised version of the entry
};

export interface Entry{
	username: string;
	id: string; // comment id, not user id
	list: string[];
	normalisedList: string[];
};

export interface Totals{
	[key: string]: {
		points: number;
		lists: number;
	}
}

class Entries{
	entries: {[key: string]: EntryStats};
	opts: EntriesOpts;
	reorderings: {[key: string]: string[]};
	constructor(opts: EntriesOpts){
		this.entries = {};
		this.opts = opts;
		this.reorderings = {};
	}

	/** adds an entire entry
	 * @param {Entry} entry
	 */
	addEntry(entry: Entry){
		// normalise the entries
		entry.normalisedList.forEach(x => {
			if(!this.reorderings[x]) this.reorderings[x] = reorder(x);
		});

		// ensure that someone didn't sneak in some duplicates via misspelling them
		// double multiplier so that you can't just make two things both 1 letter off from the correct
		if(hasDuplicates(entry.normalisedList, this.reorderings, this.opts.typoThreshold * 2)){
			throw new Error("duplicate entries in list", {
				cause: {
					list: {
						username: entry.username,
						id: entry.id
					},
					type: "duplicate"
				}
			});
		}
		else{
			for(let i = 0; i < entry.normalisedList.length; i++){ // collect points, no typo fixing just yet
				this.addItem(
					{
						real: entry.list[i],
						normal: entry.normalisedList[i]
					},
					this.opts.entryScoring[i]
				);
			}
		}	
	}

	finalise(): Totals{
		this.sort();
		this.fixDuplicates();
		let totals: Totals = {};
		for(let key in this.entries){
			const entry = this.entries[key];
			// pick the most common variant as display name
			const variantFrequency = Object.entries(entry.variants).sort(([,a],[,b]) => {
				// first, sort by lists
				const diff = b.lists - a.lists;
				if(diff !== 0) return diff;
				// then, sort by points
				const pointsDiff = b.points - a.points;
				if(pointsDiff !== 0) return pointsDiff;
				// finally, sort by order
				return 1;
			});
			const bestVariant = variantFrequency[0][0];
			totals[bestVariant] = {
				points: entry.points,
				lists: entry.lists
			}
		}
		return totals;
	}

	/*************************************************************************
	 * the following are mainly used as helper functions                     *
	 *                                                                       *
	 * they are not marked as private since they may be useful on their own  *
	 * but think twice before using them and make sure that there isn't a    *
	 * better alternative                                                    *
	 *************************************************************************/ 

	/** adds a single item
	 * @param {EntryName} item - the real entry, as well as its normalised form
	 * @param {number} points - how many points to add
	 */
	addItem(item: EntryName, points: number){
		// create new entry if needed
		if(!this.entries[item.normal]){
			this.entries[item.normal] = {
				points: 0,
				lists: 0,
				variants: {},
				discarded: false
			};
		}
		let currentItem = this.entries[item.normal];
		if(!currentItem.variants[item.real]){
			// create new spelling variant if needed
			currentItem.variants[item.real] = {
				points: 0,
				lists: 0
			}
		}
		// add points
		currentItem.points += points;
		currentItem.variants[item.real].points += points;
		currentItem.lists += 1;
		currentItem.variants[item.real].lists += 1;
	}

	/** sorts the entries by number of points */
	sort(){
		this.entries = Object.fromEntries(
			Object.entries(this.entries).sort(
				([,a],[,b]) => {
					const diff = b.points - a.points
					if(diff !== 0) return diff;
					else return b.lists - a.lists;
				}
			)
		);
	}

	/** fixes duplicates
	 * @param {[key: string]: string[]} reorderings - all the possible reorderings of each entry. used to ensure that there are no unnecessary recalculations
	 * @param {number} threshold - how many typos are acceptable before 2 words are different
	 */
	fixDuplicates(){
		// note: this function assumes that everything has been sorted prior
		const names = Object.keys(this.entries);
		for(let i = 0; i < names.length; i++){ // gets rid of typo-based duplicates
			let foundDuplicate = false;
			let j = 0;
			while(j < i && !foundDuplicate){
				const nj = names[j];
				const ni = names[i];
				// check if two items are duplicate of one another (ensuring that discarded items are not in it)
				if(!this.entries[nj].discarded && isDuplicate(this.reorderings[ni], nj, this.opts.typoThreshold)){
					// if there is a duplicate issue, add point totals to the earlier one, and discard the newer one
					let ej = this.entries[nj];
					let ei = this.entries[ni];
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
		// re-sort to account for new point totals
		this.sort();
	}
}


export default Entries;