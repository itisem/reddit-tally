import parseEntry from "./parse-entry";

describe("it parses various line formats", () => {
	test("common formats", () => {
		expect(parseEntry("1. Charli XCX")).toEqual(["Charli XCX"]);
		expect(parseEntry("2.   Kero Kero Bonito")).toEqual(["Kero Kero Bonito"]);
		expect(parseEntry("3.Chumbawamba")).toEqual(["Chumbawamba"]);
	});

	test("unusual formats i've encountered in the wild", () => {
		expect(parseEntry("#4. 385")).toEqual(["385"]);
		expect(parseEntry("* 5. f(x)")).toEqual(["f(x)"]);
		expect(parseEntry("#6) Parannoul")).toEqual(["Parannoul"]);
		expect(parseEntry("* 7: Open Mike Eagle")).toEqual(["Open Mike Eagle"]);
	});

	test("invalid lines", () => {
		expect(parseEntry("The Buggles")).toEqual([]);
		expect(parseEntry("100 gecs are my favourite band")).toEqual([]);
	})
});

describe("it parses multi-line entries", () => {
	test("standard entries", () => {
		expect(parseEntry("1. SOPHIE\r\n2. AG Cook\r\n 3. Hannah Diamond")).toEqual(["SOPHIE", "AG Cook", "Hannah Diamond"]);
		expect(parseEntry("1. Slant\n2. Midori\n 3. Special Interest\nI like to vote for punk music")).toEqual(["Slant", "Midori", "Special Interest"]);
	});
	test("mismatched numbering", () => {
		expect(parseEntry("1) Little Simz\n7. Haru Nemuri")).toEqual(["Little Simz", "Haru Nemuri"]);
	})
})