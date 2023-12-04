import Entries from "./entries";

let options = {
	typoThreshold: 1,
	entryScoring: [3, 2, 1]
};

let entries = new Entries(options);
let entries2 = new Entries(options);

describe("testing entries", () => {
	test("adding entries works", () => {
		entries.addItem({real: "aaa", normal: "aaa"}, 3);
		entries.addItem({real: "bbb", normal: "bbb"}, 2);
		entries.addItem({real: "ccc", normal: "ccc"}, 1);
		entries.addItem({real: "Bbb", normal: "bbb"}, 3);
		entries.addItem({real: "Ccc", normal: "ccc"}, 2);
		entries.addItem({real: "Ddd", normal: "ddd"}, 1);
		entries.addItem({real: "Eee", normal: "eee"}, 3);
		entries.addItem({real: "Bbb", normal: "bbb"}, 2);
		entries.addItem({real: "Ddd", normal: "ddd"}, 1);
		// these will be used for duplicate testing
		entries.addItem({real: "Aab", normal: "aab"}, 3);
		entries.addItem({real: "Bbc", normal: "bbc"}, 2);
		entries.addItem({real: "Ccd", normal: "ccd"}, 1);
		expect(entries.entries).toEqual({
			aaa: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					aaa: {
						points: 3,
						lists: 1
					}
				}
			},
			bbb: {
				points: 7,
				lists: 3,
				discarded: false,
				variants: {
					bbb: {
						points: 2,
						lists: 1
					},
					Bbb: {
						points: 5,
						lists: 2
					}
				}
			},
			ccc: {
				points: 3,
				lists: 2,
				discarded: false,
				variants: {
					ccc: {
						points: 1,
						lists: 1
					},
					Ccc: {
						points: 2,
						lists: 1
					}
				}
			},
			ddd: {
				points: 2,
				lists: 2,
				discarded: false,
				variants: {
					Ddd: {
						points: 2,
						lists: 2
					}
				}
			},
			eee: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Eee: {
						points: 3,
						lists: 1
					}
				}
			},
			aab: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Aab: {
						points: 3,
						lists: 1
					}
				}
			},
			bbc: {
				points: 2,
				lists: 1,
				discarded: false,
				variants: {
					Bbc: {
						points: 2,
						lists: 1
					}
				}
			},
			ccd: {
				points: 1,
				lists: 1,
				discarded: false,
				variants: {
					Ccd: {
						points: 1,
						lists: 1
					}
				}
			}
		});
	});

	test("sorting entries works", () => {
		entries.sort();
		expect(entries.entries).toEqual({
			bbb: {
				points: 7,
				lists: 3,
				discarded: false,
				variants: {
					bbb: {
						points: 2,
						lists: 1
					},
					Bbb: {
						points: 5,
						lists: 2
					}
				}
			},
			ccc: {
				points: 3,
				lists: 2,
				discarded: false,
				variants: {
					ccc: {
						points: 1,
						lists: 1
					},
					Ccc: {
						points: 2,
						lists: 1
					}
				}
			},
			aaa: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					aaa: {
						points: 3,
						lists: 1
					}
				}
			},
			eee: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Eee: {
						points: 3,
						lists: 1
					}
				}
			},
			aab: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Aab: {
						points: 3,
						lists: 1
					}
				}
			},
			ddd: {
				points: 2,
				lists: 2,
				discarded: false,
				variants: {
					Ddd: {
						points: 2,
						lists: 2
					}
				}
			},
			bbc: {
				points: 2,
				lists: 1,
				discarded: false,
				variants: {
					Bbc: {
						points: 2,
						lists: 1
					}
				}
			},
			ccd: {
				points: 1,
				lists: 1,
				discarded: false,
				variants: {
					Ccd: {
						points: 1,
						lists: 1
					}
				}
			}
		})
	});

	test("fixing typos works", () => {
		// manually adding reorderings since otherwise .addItem breaks
		entries.reorderings = {
			aaa: ["aaa"],
			bbb: ["bbb"],
			ccc: ["ccc"],
			ddd: ["ddd"],
			eee: ["eee"],
			aab: ["aab"],
			bbc: ["bbc"],
			ccd: ["ccd"]
		};
		entries.fixDuplicates();
		expect(entries.entries).toEqual({
			bbb: {
				points: 9,
				lists: 4,
				discarded: false,
				variants: {
					bbb: {
						points: 2,
						lists: 1
					},
					Bbb: {
						points: 5,
						lists: 2
					},
					Bbc: {
						points: 2,
						lists: 1
					}
				}
			},
			aaa: {
				points: 6,
				lists: 2,
				discarded: false,
				variants: {
					aaa: {
						points: 3,
						lists: 1
					},
					Aab: {
						points: 3,
						lists: 1
					}
				}
			},
			ccc: {
				points: 4,
				lists: 3,
				discarded: false,
				variants: {
					ccc: {
						points: 1,
						lists: 1
					},
					Ccc: {
						points: 2,
						lists: 1
					},
					Ccd: {
						points: 1,
						lists: 1
					}
				}
			},
			eee: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Eee: {
						points: 3,
						lists: 1
					}
				}
			},
			ddd: {
				points: 2,
				lists: 2,
				discarded: false,
				variants: {
					Ddd: {
						points: 2,
						lists: 2
					}
				}
			}
		});
	});

	test("adding a whole entry at once works", () => {
		entries2.addEntry({
			username: "a",
			id: "a",
			list: ["aaa", "bbb", "ccc"],
			normalisedList: ["aaa", "bbb", "ccc"]
		});
		entries2.addEntry({
			username: "b",
			id: "b",
			list: ["Bbb", "Ccc", "Ddd"],
			normalisedList: ["bbb", "ccc", "ddd"]
		});
		entries2.addEntry({
			username: "b",
			id: "b",
			list: ["Aax", "Bbb", "Ddd"],
			normalisedList: ["aax", "bbb", "ddd"]
		});
		expect(entries2.entries).toEqual({
			aaa: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					aaa: {
						points: 3,
						lists: 1
					}
				}
			},
			bbb: {
				points: 7,
				lists: 3,
				discarded: false,
				variants: {
					bbb: {
						points: 2,
						lists: 1
					},
					Bbb: {
						points: 5,
						lists: 2
					}
				}
			},
			ccc: {
				points: 3,
				lists: 2,
				discarded: false,
				variants: {
					ccc: {
						points: 1,
						lists: 1
					},
					Ccc: {
						points: 2,
						lists: 1
					}
				}
			},
			ddd: {
				points: 2,
				lists: 2,
				discarded: false,
				variants: {
					Ddd: {
						points: 2,
						lists: 2
					}
				}
			},
			aax: {
				points: 3,
				lists: 1,
				discarded: false,
				variants: {
					Aax: {
						points: 3,
						lists: 1
					}
				}
			}
		});
	});

	test("adding an entry with duplicates (after typo fixing) does not work", () => {
		expect(() => entries.addEntry({
				username: "a",
				id: "a",
				list: ["aaa", "aab", "ccc"],
				normalisedList: ["aaa", "aab", "ccc"]
		})).toThrow();
	});

	test("finalising works", () => {
		expect(entries2.finalise()).toEqual({
			Bbb: {
				points: 7,
				lists: 3
			},
			aaa: {
				points: 6,
				lists: 2
			},
			Ccc: {
				points: 3,
				lists: 2
			},
			Ddd: {
				points: 2,
				lists: 2
			}
		})
	})
});