import Snoowrap from "snoowrap";
import cookie from "cookie";
import {distance} from "fastest-levenshtein";

import Entries from "/utils/entries";
import hasDuplicates from "/utils/has-duplicates";
import normalise from "/utils/normalise";
import parseEntry from "/utils/parse-entry";
import range from "/utils/range";
import reorder from "/utils/reorder";

import {EntryStats} from "/types";

export default function tally(req, res){
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};

	if(!cookies.token) return res.json({error: true, message: "no oauth token"});

	if(req.query.listType){
		if(!["artistTitle", "raw"].includes(req.query.listType)) return res.status(400).json({error: true, message: "listType needs to be one of 'raw', 'artistTitle'"});
	}

	let settings = {
		thread: req.query.thread,
		listType: req.query.listType || "artistTitle",
		typoThreshold: 1,
		entryCount: 10,
		entryScoring: []
	};

	let entries = new Entries();

	try{
		settings.typoThreshold = req.query.typoThreshold !== undefined ? +req.query.typoThreshold : 1;
	}
	catch{
		return res.status(400).json({error: true, message: "typo threshold needs to be a number"});
	}

	try{
		settings.entryCount = req.query.entryCount !== undefined ? +req.query.entryCount : 10;
	}
	catch{
		return res.status(400).json({error: true, message: "entry count needs to be a number"});
	}

	if(req.query.entryScoring){
		try{
			const tmpScoring = req.query.entryScoring.split(",").map(x => +x);
			if(tmpScoring.length === entryCount) settings.entryScoring = tmpScoring;
			else return res.status(400).json({error: true, message: "scoring system contains incorrect number of scores"});
		}
		catch{
			return res.status(400).json({error: true, message: "scoring system contains non-numeric values"});
		}
	}
	else{
		settings.entryScoring = range(settings.entryCount).map(x => x+1).reverse();
	}

	let reorderings = {};

	const r = new Snoowrap({
		userAgent: "reddit-tally",
		accessToken: cookies.token
	});
	const submission = r.getSubmission(settings.thread);
	submission.expandReplies({limit: Infinity, depth: Infinity}).then(response => {
		const comments = response.comments;
		let parsedUsers = [];
		let lists = {};
		let duplicateUsers = new Set();
		let duplicateUserLists = [];
		let duplicateEntryLists = [];
		let wrongCountLists = [];

		// basic parsing and sanity checks for entries
		for(let comment of comments){
			let parseList = true;
			const username = comment.author.name;
			if(comment.parent_id !== submission.name) continue; // should never happen, but just in case snoowrap changes: non-toplevel comments are not entries
			if(comment.distinguished) continue; // mod comments are not entries
			if(comment.removed) continue;
			if(username === "[deleted]") continue;

			// remove users with duplicate entries
			if(parsedUsers.includes(username)){
				duplicateUserLists.push({username, id: comment.id});
				if(lists[username]) duplicateUserLists.push({username, id: lists[username].id});
				duplicateUsers.add(username);
				delete lists[username];
			}

			const entry = parseEntry(comment.body);

			if(entry.length !== settings.entryCount){
				wrongCountLists.push({username, id: comment.id});
				parseList = false;
			}

			if(entry.length !== new Set(entry).size){
				duplicateEntryLists.push({username, id: comment.id});
				parseList = false;
			}
			parsedUsers.push(username);

			if(parseList) lists[username] = {username, list: entry, id: comment.id};
		}

		for(let user in lists){ // parses user lists completely, but doesn't fix the typos here
			let list = lists[user];
			// doing it like this prevents having to reorder/re-normalise everything n times. not the prettiest, but it does the job
			const normalisedEntries = list.list.map(x => normalise(x, settings.listType));
			normalisedEntries.forEach(x => {
				if(!reorderings[x]) reorderings[x] = reorder(x);
			});

			// ensure that someone didn't sneak in some duplicates via misspelling them
			// double multiplier so that you can't just make two things both 1 letter off from the correct
			if(hasDuplicates(normalisedEntries, reorderings, settings.typoThreshold * 2)){
				duplicateEntryLists.push({username: list.username, id: list.id});
			}
			else{
				for(let i = 0; i < normalisedEntries.length; i++){ // collect points, no typo fixing just yet
					entries.add({real: list.list[i], normal: normalisedEntries[i]}, settings.entryScoring[i]);
				}
			}		
		}

		entries.sort(); // sort by points
		entries.fixDuplicates(reorderings, settings.typoThreshold);

		let finalEntries = {};
		for(let key in entries.entries){
			const entry = entries.entries[key];
			const variantFrequency = Object.entries(entry.variants).sort(([,a],[,b]) => b.lists - a.lists); // pick the most common variant as display name
			finalEntries[variantFrequency[0][0]] = {
				points: entry.points,
				lists: entry.lists
			};
		}

		duplicateUsers = Array.from(duplicateUsers);
		res.json({
			entries: finalEntries,
			discardedEntries: {
				userHasMultiplePosts: duplicateUserLists,
				postHasDuplicateEntries: duplicateEntryLists,
				postHasWrongEntryCount: wrongCountLists
			}
		});
	}).catch(() => res.status(400).json({error: true, message: "reddit api error"}));
}