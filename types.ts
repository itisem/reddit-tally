export type ListType = "raw" | "artistTitle";

export type EntryStats = {
	points: number,
	lists: number,
	variants: {[key: string]: EntryVariant},
	discarded: boolean
};

type EntryVariant = {
	points: number,
	lists: number
}