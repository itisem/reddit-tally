import normalise from "./normalise";

describe("normalises entries correctly", () => {
	test("regular english text", () => {
		expect(normalise("Stockholm")).toEqual("stockholm");
		expect(normalise("Groningen, The Netherlands")).toEqual("groningennetherlands");
		expect(normalise("Saint-Louis-du-Ha! Ha!")).toEqual("saintlouisduhaha");
		expect(normalise("Saint-Louis-du-Ha! Ha!", "artistTitle")).toEqual("saint - louis - du - haha");
	});
	test("accents and non-latin", () => {
		expect(normalise("ciudad de méxico")).toEqual("ciudaddemexico");
		expect(normalise("부산")).toEqual("busan");
	})
})