import hasDuplicates from "./has-duplicates";
import reorder from "./reorder";

describe("checks for duplicates", () => {
	test("simple list with no reordering", () => {
		let entries = ["hello", "g'day", "buongiorno", "goedendag"];
		let reorderings = {};
		for(let entry of entries){
			reorderings[entry] = reorder(entry);
		}
		expect(hasDuplicates(entries, reorderings)).toEqual(false);
		expect(hasDuplicates(entries, reorderings, 1)).toEqual(false);
		expect(hasDuplicates(entries, reorderings, 5)).toEqual(true);
	});

	test("list with some reordering", () => {
		let entries = ["hi - sup", "sup - yo", "hey - how are you"];
		let reorderings = {};
		for(let entry of entries){
			reorderings[entry] = reorder(entry, "artistTitle");
		}
		expect(hasDuplicates(entries, reorderings)).toEqual(false);
		expect(hasDuplicates(entries, reorderings, 1)).toEqual(false);
		expect(hasDuplicates(entries, reorderings, 3)).toEqual(true);
		let entries2 = ["heya - buenosdias", "buenosdias - heya"];
		let reorderings2 = {};
		for(let entry of entries2){
			reorderings2[entry] = reorder(entry, "artistTitle");
		}
		expect(hasDuplicates(entries2, reorderings2)).toEqual(true);
	});
})