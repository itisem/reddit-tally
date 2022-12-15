import Snoowrap from "snoowrap";
import cookie from "cookie";
import unidecode from "unidecode";
import {distance} from "fastest-levenshtein";

const range = n => [...Array(n).keys()];

function parseEntry(entry){
	let entries = [];
	const lines = entry.split(/\r?\n/).map(x => x.trim());
	for(let line of lines){
		const matches = line.match(/[#*]?\s?\d{1,2}[:\.)]?\s?(.*)$/u); // should match any semi-reasonable format
		if(matches){
			entries.push(matches[1]);
		}
	}
	return entries;
}

function normalise(entry){
	let s = unidecode(entry);
	s = s.toLowerCase();
	s = s.replaceAll("&", " ").replaceAll(/\band\b/gu, " ").replaceAll(/\bthe\b/gu, " ");
	s = s.replaceAll("—", "-").replaceAll("-", " - ").replaceAll(/( - )+/gu, " - ");
	s = s.replaceAll(/[^0-9a-z\- ]/g, "");
	s = s.replace(/\s+/g, " ");
	s = s.trim();
	return s;
}

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

	const reorder = (checkThis) => {
		let reorderings = [];
		switch(settings.listType){
			case "artistTitle":
				const possibleSplits = checkThis.split(" - ");
				reorderings = [...Array(possibleSplits.length).keys()].map(i => [...possibleSplits.slice(i), ...possibleSplits.slice(0, i)].join(" - "));
				break;
			case "raw":
				reorderings = [checkThis];
				break;
		}
		return reorderings;
	}

	const addReordering = (checkThis) => {
		if(!reorderings[checkThis]){
			reorderings[checkThis] = reorder(checkThis);
		}
	}

	const notEqual = (checkThis, against, thresholdMultiplier) => checkThis.every(x => distance(x, against) > thresholdMultiplier * settings.typoThreshold);

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
		let entries = {};

		for(let comment of comments){
			let parseList = true;
			const username = comment.author.name;
			if(comment.parent_id !== submission.name) continue;
			if(comment.distinguished) continue;
			if(comment.removed) continue;
			if(username === "[deleted]") continue;

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
			const normalisedEntries = list.list.map(x => normalise(x));
			normalisedEntries.map(x => addReordering(x));
			let validList = true;
			for(let i = 0; i < normalisedEntries.length; i++){ // ensure that someone didn't sneak in some duplicates via misspelling them
				validList = validList && normalisedEntries.slice(0,i).every(x => notEqual(reorderings[normalisedEntries[i]], x, 2)); // double multiplier so that you can't just make two things both 1 letter off from the correct
			}

			if(!validList){
				duplicateEntryLists.push({username: list.username, id: list.id});
			}
			else{
				for(let i = 0; i < normalisedEntries.length; i++){ // collect points, no typo fixing just yet
					if(!entries[normalisedEntries[i]]){
						entries[normalisedEntries[i]] = {
							points: 0,
							lists: 0,
							variants: {},
							discarded: false
						};
					}
					let entryItem = entries[normalisedEntries[i]];
					entryItem.lists += 1;
					entryItem.points += settings.entryScoring[i];
					if(!entryItem.variants[list.list[i]]){
						entryItem.variants[list.list[i]] = {
							points: 0,
							lists: 0
						};
					}
					entryItem.variants[list.list[i]].lists += 1;
					entryItem.variants[list.list[i]].points += settings.entryScoring[i];
				}
			}		
		}

		entries = Object.fromEntries(Object.entries(entries).sort(([,a],[,b]) => b.points - a.points)); // sort by points
		const entryNames = Object.keys(entries);
		for(let i = 0; i < entryNames.length; i++){ // gets rid of typo-based duplicates
			let foundDuplicate = false;
			let j = 0;
			while(j < i && !foundDuplicate){
				if(!entryNames[j].discarded && !notEqual(reorderings[entryNames[i]], entryNames[j], 1)){
					let ej = entries[entryNames[j]];
					let ei = entries[entryNames[i]];
					ej.points += ei.points;
					ej.lists += ei.lists;
					ej.variants = {...ej.variants, ...ei.variants};
					ei.discarded = true;
					foundDuplicate = true;
				}
				j += 1;
			}
		}

		let finalEntries = {};
		for(let key in entries){
			const entry = entries[key];
			if(!entry.discarded){
				const variantFrequency = Object.entries(entry.variants).sort(([,a],[,b]) => b.lists - a.lists); // pick the most common variant as display name
				finalEntries[variantFrequency[0][0]] = {
					points: entry.points,
					lists: entry.lists
				};
			}
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