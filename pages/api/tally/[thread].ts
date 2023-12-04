import Snoowrap from "snoowrap";
import cookie from "cookie";

import Entries, {EntryStats, EntriesOpts, Entry} from "../../../utils/entries";
import parseEntries, {ParseEntriesOpts, SimpleComment} from "../../../utils/parse-entries";
import range from "../../../utils/range";

import type {NextApiRequest, NextApiResponse} from "next";

export interface Result{
	points: number;
	lists: number;
}

export interface Results{
	[key: string]: Result;
}

export interface ResponseErrors{
	userHasMultiplePosts: SimpleComment[];
	postHasDuplicateEntries: SimpleComment[];
	postHasWrongEntryCount: SimpleComment[];
}

export interface ApiResponse{
	entries: Results;
	discardedEntries: ResponseErrors;
}

export default function tally(req: NextApiRequest, res: NextApiResponse){
	// the reddit api requires an oauth token, so if that fails, fail
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
	if(!cookies.token) return res.json({error: true, message: "no oauth token"});
	// make sure that the list type is real (required param)
	if(req.query.listType){
		if(!["artistTitle", "raw"].includes(req.query.listType as string)){
			return res.status(400).json({error: true, message: "listType needs to be one of 'raw', 'artistTitle'"});
		}
	}
	// create some base settings to start with
	let parseOpts: ParseEntriesOpts = {
		listType: (req.query.listType as string) || "artistTitle",
		entryCount: 10,
	};

	let entriesOpts: EntriesOpts = {
		typoThreshold: 1,
		entryScoring: []
	};

	let thread: string = req.query.thread as string;

	// change typo threshold if it exists as a param
	if(req.query.typoThreshold !== undefined){
		try{
			entriesOpts.typoThreshold = +(req.query.typoThreshold as string);
		}
		catch{
			return res.status(400).json({error: true, message: "typo threshold needs to be a number"});
		}
	}

	// change entry count if it exists as a param
	if(req.query.entryCount !== undefined){
		try{
			parseOpts.entryCount =  +(req.query.entryCount as string);
		}
		catch{
			return res.status(400).json({error: true, message: "entry count needs to be a number"});
		}
	}

	// change entry scoring if it exists as a param
	if(req.query.entryScoring){
		try{
			// ensure that the scoring system is the correct length
			const tmpScoring = (req.query.entryScoring as string).split(",").map(x => +x);
			if(tmpScoring.length === parseOpts.entryCount) entriesOpts.entryScoring = tmpScoring;
			else return res.status(400).json({error: true, message: "scoring system contains incorrect number of scores"});
		}
		catch{
			return res.status(400).json({error: true, message: "scoring system contains non-numeric values"});
		}
	}
	else{
		// create a default scoring system
		entriesOpts.entryScoring = range(parseOpts.entryCount).map(x => x+1).reverse();
	}

	let entries = new Entries(entriesOpts); // all entries

	const r = new Snoowrap({
		userAgent: "reddit-tally",
		accessToken: cookies.token
	});
	// get all comments
	const submission = r.getSubmission(thread);
	submission.expandReplies({limit: Infinity, depth: Infinity}).then(response => {
		const comments = response.comments;
		let {lists, duplicateUserLists, duplicateEntryLists, wrongCountLists} = parseEntries(comments, parseOpts);
		for(let user in lists){
			try{
				entries.addEntry(lists[user]);
			}
			catch(e){
				if(e.cause?.type === "duplicate"){
					duplicateEntryLists.push(e.cause?.list as SimpleComment);
				}
			}
		}
		res.json({
			entries: entries.finalise(),
			discardedEntries: {
				userHasMultiplePosts: duplicateUserLists,
				postHasDuplicateEntries: duplicateEntryLists,
				postHasWrongEntryCount: wrongCountLists
			}
		});
	}).catch(() => res.status(400).json({error: true, message: "reddit api error"}));
}