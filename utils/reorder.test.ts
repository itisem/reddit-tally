import reorder from "./reorder";

describe("normal lists", () => {
	test("no reordering needed", () => {
		expect(reorder("daftpunk", "raw")).toEqual(["daftpunk"]);
		expect(reorder("harunemuri - makemorenoiseofyou")).toEqual(["harunemuri - makemorenoiseofyou"]);
	});
});

describe("artist-title lists", () => {
	test("no reordering possible", () => {
		expect(reorder("daftpunk", "artistTitle")).toEqual(["daftpunk"]);
	});
	test("reordering possible", () => {
		expect(reorder("harunemuri - makemorenoiseofyou", "artistTitle")).toEqual(["harunemuri - makemorenoiseofyou", "makemorenoiseofyou - harunemuri"]);
		expect(reorder("melt - banana - freethebee", "artistTitle")).toEqual(["melt - banana - freethebee", "banana - freethebee - melt", "freethebee - melt - banana"]);
	})
});