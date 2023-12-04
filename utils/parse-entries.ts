import parseEntry from "./parse-entry";
import normalise from "./normalise";
import hasDuplicates from "./has-duplicates";
import reorder, {ListType} from "./reorder";
import Entries, {EntryStats} from "./entries";

import type {Comment} from "snoowrap";

export interface ParseEntriesOpts{
	entryCount: number;
	listType: string;
	typoThreshold: number;
	entryScoring: number[];
	thread: string;
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

export interface Entry extends SimpleComment{
	list: string[];
}

export interface ParseEntriesResults{
	duplicateUserLists: SimpleComment[];
	duplicateEntryLists: SimpleComment[];
	wrongCountLists: SimpleComment[];
	entries: Entries;
	reorderings: {[key: string]: string[]};
}

// does some basic parsing on all entries, but no typo fixing
export default function parseEntries(comments: (Comment | FakeComment)[], opts: ParseEntriesOpts): ParseEntriesResults{
	let entries = new Entries(); // all entries
	let reorderings: {[key: string]: string[]} = {}; // all possible text reorderings of stuff
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
		const entry = parseEntry(comment.body);
		// remove entries with wrong counts
		if(entry.length !== opts.entryCount){
			wrongCountLists.push({username, id: comment.id});
			continue;
		}
		// remove entries with duplicates
		if(entry.length !== new Set(entry).size){
			duplicateEntryLists.push({username, id: comment.id});
			continue;
		}
		parsedUsers.push(username);
		// add list to lists
		lists[username] = {username, list: entry, id: comment.id};
	}
	// normalisation, no typo fixing
	for(let user in lists){
		const list = lists[user];
		// doing it like this prevents having to reorder/re-normalise everything n times. not the prettiest, but it does the job
		const normalisedEntries = list.list.map(x => normalise(x, opts.listType as ListType));
		normalisedEntries.forEach(x => {
			if(!reorderings[x]) reorderings[x] = reorder(x);
		});

		// ensure that someone didn't sneak in some duplicates via misspelling them
		// double multiplier so that you can't just make two things both 1 letter off from the correct
		if(hasDuplicates(normalisedEntries, reorderings, opts.typoThreshold * 2)){
			duplicateEntryLists.push({username: list.username, id: list.id});
		}
		else{
			for(let i = 0; i < normalisedEntries.length; i++){ // collect points, no typo fixing just yet
				entries.add({real: list.list[i], normal: normalisedEntries[i]}, opts.entryScoring[i]);
			}
		}		
	}
	return {entries, duplicateUserLists, duplicateEntryLists, wrongCountLists, reorderings};
}