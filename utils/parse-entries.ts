import parseEntry from "./parse-entry";
import normalise from "./normalise";
import hasDuplicates from "./has-duplicates";
import type {ListType} from "./reorder";
import type {Entry} from "./entries";
import type {Comment} from "snoowrap";

export interface ParseEntriesOpts{
	entryCount: number;
	listType: string;
}

export interface SimpleComment{
	username: string;
	id: string; // comment id, not user id
}

interface FakeComment{
	distinguished: "admin" | "moderator" | null,
	removed: boolean,
	author: {
		name: string
	},
	id: string,
	body: string
}

export interface ParseEntriesResults{
	duplicateUserLists: SimpleComment[];
	duplicateEntryLists: SimpleComment[];
	wrongCountLists: SimpleComment[];
	lists: {[key: string]: Entry};
}

// does some basic parsing on all entries, but no typo fixing
export default function parseEntries(comments: (Comment | FakeComment)[], opts: ParseEntriesOpts): ParseEntriesResults{
	// create a new entries set to add
	let parsedUsers: string[] = []; // list of users, used for duplicate lists
	let lists: {[key: string]: Entry} = {};
	let duplicateUserSet: Set<string> = new Set(); // all duplicate users
	// all users with duplicates
	let duplicateUserLists: SimpleComment[] = [];
	let duplicateEntryLists: SimpleComment[] = [];
	let wrongCountLists: SimpleComment[] = [];
	// basic parsing, no normalisation
	for(let comment of comments){
		const username: string = comment.author.name;
		if(comment.distinguished) continue; // mod comments are not entries
		if(comment.removed) continue; // removed comments are not entries
		if(username === "[deleted]") continue; // deleted users are not entries

		// remove users with duplicate entries
		if(parsedUsers.includes(username)){
			duplicateUserLists.push({username, id: comment.id});
			if(lists[username]) duplicateUserLists.push({username, id: lists[username].id});
			duplicateUserSet.add(username);
			delete lists[username];
			continue;
		}
		// turn an entry to a usable list
		let entry = parseEntry(comment.body);
		let normalisedEntry = entry.map(x => normalise(x, opts.listType as ListType));
		// remove entries with wrong counts
		if(entry.length !== opts.entryCount){
			wrongCountLists.push({username, id: comment.id});
			continue;
		}
		// remove entries with duplicates
		if(normalisedEntry.length !== new Set(normalisedEntry).size){
			duplicateEntryLists.push({username, id: comment.id});
			continue;
		}
		parsedUsers.push(username);
		// add list to lists
		lists[username] = {username, list: entry, normalisedList: normalisedEntry, id: comment.id};
	}
	return {lists, duplicateUserLists, duplicateEntryLists, wrongCountLists};
}