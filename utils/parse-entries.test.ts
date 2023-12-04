import parseEntries from "./parse-entries";

describe("entry parsing", () => {
	test("it parses entries correctly", () => {
		expect(
			parseEntries([
				{
					author: {name: "user1"},
					distinguished: null,
					removed: false,
					id: "a",
					body: "1. a\n2. b\n 3. c"
				},
				{
					author: {name: "user2"},
					distinguished: null,
					removed: false,
					id: "b",
					body: "1. a\n2. c\n 3. d"
				},
				{
					author: {name: "user3"},
					distinguished: null,
					removed: false,
					id: "c",
					body: "1. a\n2. b\n 3. c"
				},
				{
					author: {name: "user3"},
					distinguished: null,
					removed: false,
					id: "d",
					body: "1. a\n2. b\n 3. c"
				},
				{
					author: {name: "user4"},
					distinguished: null,
					removed: false,
					id: "e",
					body: "1. a\n2. a\n 3. c"
				},
				{
					author: {name: "user5"},
					distinguished: null,
					removed: false,
					id: "f",
					body: "1. a\n2. b\n 3. c\n4. d"
				},
				{
					author: {name: "user6"},
					distinguished: "moderator",
					removed: false,
					id: "g",
					body: "1. hihi"
				},
				{
					author: {name: "user7"},
					distinguished: null,
					removed: true,
					id: "h",
					body: "1. a\n2. b\n 3. c"
				},
				{
					author: {name: "[deleted]"},
					distinguished: null,
					removed: false,
					id: "i",
					body: "1. a\n2. b\n 3. c"
				},
				{
					author: {name: "user8"},
					distinguished: null,
					removed: true,
					id: "j",
					body: "1. C\r\n2. d\r\n 3.E"
				},
				{
					author: {name: "user8"},
					distinguished: null,
					removed: false,
					id: "k",
					body: "1. C\r\n2. d\r\n 3.E"
				}
			],
			{
				entryCount: 3,
				listType: "raw"
			}
		)).toEqual({
			lists: {
				user1: {
					username: "user1",
					id: "a",
					list: ["a", "b", "c"],
					normalisedList: ["a", "b", "c"]
				},
				user2: {
					username: "user2",
					id: "b",
					list: ["a", "c", "d"],
					normalisedList: ["a", "c", "d"]
				},
				user8: {
					username: "user8",
					id: "k",
					list: ["C", "d", "E"],
					normalisedList: ["c", "d", "e"]
				}
			},
			duplicateUserLists: [
				{
					id: "d",
					username: "user3"
				},
				{
					id: "c",
					username: "user3"
				},
			],
			duplicateEntryLists: [
				{
					id: "e",
					username: "user4"
				},
			],
			wrongCountLists: [
				{
					id: "f",
					username: "user5"
				},
			]
		})
	})
})