import cookie from "cookie";
import {stringify} from "csv";

import {useState, useEffect} from 'react';
import Head from "next/head";

import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import {ThemeProvider, createTheme} from '@mui/material/styles';

import Results from "/components/results";
import Errors from "/components/errors";
import HelpButton from "/components/help-button";
import DownloadButtons from "/components/download-buttons";

import downloadFile from "/utils/download-file";

// mui colour palette
const theme = createTheme({
	palette: {
		text: {
			primary: "#cccccc",
			secondary: "#cccccc",
		},
		primary: {
			main: "#cccccc",
		},
		action: {
			disabled: "rgba(204,204,204,.3)",
			selectedOpacity: 0.2,
			hoverOpacity: 0.1
		}
	},
	typography:{
		fontFamily: "Manrope",
		button: {
			textTransform: "none"
		}
	},
	components: {
		MuiToggleButton: {
			styleOverrides: {
				root: {
					color: "#cccccc"
				}
			}
		}
	}
});

export default function ThemedPage(){
	// add mui to the actual page
	return (<ThemeProvider theme={theme}><RedditPollTally /></ThemeProvider>);
}

// the main contents of the page itself
function RedditPollTally(){
	// username
	const [displayName, setDisplayName] = useState("");

	// list-related settings
	const [listType, setListType] = useState("artistTitle");
	const [itemsScored, setItemsScored] = useState(10);
	const [fixTypos, setFixTypos] = useState(1);
	const [postID, setPostID] = useState("");
	const [activePostId, setactivePostId] = useState("");
	const [scoringSystem, setScoringSystem] = useState("");

	// error messages
	const [displayError, setDisplayError] = useState(false);
	const [errorQueue, setErrorQueue] = useState([]);
	const [currentError, setCurrentError] = useState("");

	// current state of computation
	const [displayResults, setDisplayResults] = useState(false);
	const [displayLoading, setDisplayLoading] = useState(false);

	// results
	const [results, setResults] = useState({
		entries: {},
		discardedEntries: {userHasMultiplePosts: [], postHasDuplicateEntries: [], postHasWrongEntryCount: []},
	});

	// download related settings
	const [downloadItems, setDownloadItems] = useState(9999);
	const [downloadFormat, setDownloadFormat] = useState("csv");

	// regex to find the reddit post id
	const idRegex = /^[a-z0-9]{3,8}$/;

	// various onchange handlers, mainly just for sanity
	const handleListType = e => setListType(e.target.value);
	const handleItemsScored = e => setItemsScored(+e.target.value);
	const handleFixTypos = e => setFixTypos(+e.target.value);
	const handleDownloadItems = e => setDownloadItems(+e.target.value);
	const handleDownloadFormat = e => setDownloadFormat(e.target.value);
	const handlePostID = e => {
		let v = e.target.value.trim();

		if(v === ""){
			setPostID("");
			return;
		}

		// find the reddit post id in a long url
		const postRegex = /^https?:\/\/(?:www\.)?reddit\.com\/r\/[a-zA-Z0-9_-]{3,20}\/comments\/([a-z0-9]{0,8})(?:\/.*)?$/u;
		const postMatches = v.match(postRegex);
		if(postMatches){
			setPostID(postMatches[1]);
			return;
		}
		// find the reddit post id in a short url
		const shortenedRegex = /^https?:\/\/(?:www\.)?redd\.it\/([a-z0-9]{0,8})\/?$/u;
		const shortenedMatches = v.match(shortenedRegex);
		if(shortenedMatches){
			setPostID(shortenedMatches[1]);
			return;
		}
		// find the reddit post id in just an id
		const idMatches = v.match(idRegex);
		if(idMatches){
			setPostID(v);
		}
		return;
	}
	const handleScoringSystem = e => {
		let v = e.target.value.trim();
		// make sure that the scoring system is all numbers by converting everything to numbers and then rejoining afterwards
		let points = v.split(",");
		try{
			points.map(x => +x.trim());
			setScoringSystem(points.join(","));
		}
		catch{
			// not a number! we need to do nothing, just don't let it happen again
		}
	}

	// show and hide error messages
	const showError = message => {
		if(displayError){
			setErrorQueue([...errorQueue, message]);
		}
		else{
			setCurrentError(message);
		}
	}
	const hideError = () => {
		setDisplayError(false);
		if(errorQueue.length > 0){
			setDisplayError(true);
			setCurrentError(errorQueue[0]);
			setErrorQueue(errorQueue.slice(1));
			setTimeout(hideError, 5000);
		}
	}

	const validateForm = () => {
		// by all accounts, the onchange regex handlers SHOULD ensure that the post id is valid
		// but i am adding a duplicate check here to make sure anyway since it's not performance intensive
		if(!postID.match(idRegex)) return false;
		if(itemsScored < 1) return false;
		// more than 100 items doesn't actually cause much of an error for the code but it may slow things down a fair bit
		// given that all entries are checked against eachother for typos and whatnot
		// and realistically, no one will ever do a top 100 list anyway
		if(itemsScored > 100) return false;
		// ensure that the scoring system's length is the same as the number of items scored
		const scoringSplit = scoringSystem.split(",");
		if(scoringSystem.length !== 0 && scoringSplit.length !== itemsScored) return false;
		return true;
	}

	const submit = () => {
		// do loading screen
		setDisplayResults(false);
		setDisplayLoading(true);
		// validate stuff
		const submittedPost = postID;
		if(!validateForm()){
			showError("invalid settings");
			return;
		}
		// everything looks right, create new url
		const params = new URLSearchParams();
		params.set("listType", listType);
		params.set("entryCount", itemsScored);
		params.set("entryScoring", scoringSystem);
		params.set("typoThreshold", fixTypos);
		const url = `/api/tally/${postID}?${params.toString()}`;
		fetch(url).then(r => r.json()).then(r => {
			// not loading anymore
			setactivePostId(submittedPost);
			setDisplayLoading(false);
			// the api returned an error for one reason or another
			if(r.error){
				showError(r.message);
				return;
			}
			// we have results
			setDisplayResults(true);
			setResults(r);
		})
	};

	const download = () => {
		// get the actual entries as a simple object format
		const entriesRaw = Object.entries(results.entries).slice(0, downloadItems);
		const entriesReal = entriesRaw.map(x => ({entry: x[0], points: x[1].points, lists: x[1].lists}));
		// fixes for | in case it is a markdown table download
		const tableFix = x => x.replaceAll("|", "");
		switch(downloadFormat){
			case "csv":
				// create a csv from the list
				stringify(
					entriesReal,
					{
						headers: true, // file includes headers
						columns: {entry: "entry", points: "points", lists: "lists"} // column names
					},
					(error, result) => {
						if(error) return showError("error while downloading csv");
						downloadFile(result, activePostId, "csv"); // start download once csv is ready
					}
				);
				break;
			case "markdown":
				// literally just simple text replacements
				const base = "|Entry|Points|Lists|\r\n|-|-|-|\r\n";
				const entriesMD = entriesReal.map(x => `|${tableFix(x.entry)}|${x.points}|${x.lists}|`).join("\r\n");
				downloadFile(base + entriesMD, activePostId, "md");
				break;
			default:
				// this should never happen since the download format is selected in the ui
				showError("unsupported download format");
		}
	}

	useEffect(() => {
		// check if there is already an oauth token set after the page loads
		// (document.cookie is not accessible beforehand, and while it *could* be used as a serverside prop, that is unnecessary complication)
		let parsedCookies = cookie.parse(document.cookie);
		if(parsedCookies.token){
			fetch("/api/me").then(x => x.json()).then(x => {
				if(!x.error) setDisplayName(x.displayName);
			});
		}
	}, []); // display page correctly if authenticated

	return (
		<div className="container">
			<Head>
				<title>reddit tally</title>
			</Head>
			<header>
				<h1>reddit tally</h1>
				<p>{displayName ? <>logged in as <b>{displayName}</b></> : <a href="/api/auth">login with reddit</a> }</p>
			</header>
			<div id="logged-out" style={{display: displayName ? "none" : "block"}}>
				To use this tool, please <a href="/api/auth">click here to authenticate with reddit</a>.
			</div>
			<section 
				id="settings"
				style={{
					display: displayName ? "grid" : "none",
					gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
					gap: "25px 0px"
				}}
				tabIndex={-1}
				onKeyDown={e => {if(e.keyCode===13)submit()}}
			>
				<div id="list-id">
					<TextField
						label={<>post id<HelpButton text="paste the post id or url here. must be a post and not a comment" /></>}
						InputLabelProps={{shrink: true}}
						value={postID}
						onChange={handlePostID}
						required
					/>
				</div>
				<div id="entry-count">
					<TextField
						type="number"
						label={<>items scored<HelpButton text="number of entries processed" /></>}
						value={itemsScored}
						onChange={handleItemsScored}
						InputProps={{inputProps: {min: 1, max: 100}}}
						required
					/>
				</div>
				<div id="scoring-system">
					<TextField
						label={<>scoring system<HelpButton text="numbers separated by commas. if you leave this empty, the tool will default to decreasing point counts by 1 for each position" /></>}
						InputLabelProps={{shrink: true}}
						value={scoringSystem}
						onChange={handleScoringSystem}
					/>
				</div>
				<div id="fix-typos">
					<TextField
						type="number"
						label={<># of fixed typos<HelpButton text="how many typos to fix before considering 2 entries separate" /></>}
						value={fixTypos}
						onChange={handleFixTypos}
						InputProps={{inputProps: {min: 0, max: 5}}}
						required
					/>
				</div>
				<div id="list-type" className="tbc-container">
					<ToggleButtonGroup
						exclusive
						value={listType}
						onChange={handleListType}
					>
						<ToggleButton value="artistTitle">artist - title</ToggleButton>
						<ToggleButton value="raw">raw entries</ToggleButton>
					</ToggleButtonGroup>
					<label>
						list type
						<HelpButton text="use raw for all lists that are not artist - title lists"/>
						<span className="tbc-required">*</span>
					</label>
				</div>
				<div id="submit">
					<Button
						variant="contained"
						onClick={submit}
						disabled={!validateForm()}
					>
						submit
					</Button>
				</div>
			</section>
			<section
				id="results"
				style={{
					display: displayResults ? "block" : "none"
				}}
			>
				<h2>results</h2>
				<DownloadButtons format={downloadFormat} items={downloadItems} callbacks={{format: handleDownloadFormat, items: handleDownloadItems, download: download}} />
				<Results results={results}/>
				<DownloadButtons format={downloadFormat} items={downloadItems} callbacks={{format: handleDownloadFormat, items: handleDownloadItems, download: download}} />
			</section>
			<section
				id="errors"
				style={{
					display: displayResults ? "block" : "none"
				}}
			>
				<h2>errors</h2>
				<Errors results={results} />
			</section>
			<section id="loading" style={{display: displayLoading ? "block" : "none"}}>
				loading...
			</section>
			<Alert
				severity="error"
				variant="filled"
				style={{
					display: displayError ? "flex" : "none",
					position: "absolute",
					top: 10,
					left: "50%",
					transform: "translateX(-50%)",
					width: "max(80vw, 1200px)"
				}}
				onClose={hideError}
			>
				{currentError}
			</Alert>
		</div>
	);
}