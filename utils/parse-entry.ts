/** parses an entry comment into a list
 * @param {string} entry - a user's entry
 */
export default function parseEntry(entry: string): string[]{
	let entries = [];
	const lines = entry.split(/\r?\n/).map(x => x.trim());
	for(let line of lines){
		const matches = line.match(/^[#*]?\s?\d+[:\.)]\s*(.*)$/u); // should match any semi-reasonable format
		if(matches){
			// numbers get ignored during ranking because most mismatched numbers i've seen on reddit were due to formatting issues, rather than out-of-order entries
			entries.push(matches[1]);
		}
	}
	return entries;
}