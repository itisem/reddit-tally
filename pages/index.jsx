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
	return (<ThemeProvider theme={theme}><RedditPollTally /></ThemeProvider>);
}

function RedditPollTally(){
	const [displayName, setDisplayName] = useState("");

	const [listType, setListType] = useState("artistTitle");
	const [itemsScored, setItemsScored] = useState(10);
	const [fixTypos, setFixTypos] = useState(1);
	const [postID, setPostID] = useState("");
	const [activePostID, setActivePostID] = useState("");
	const [scoringSystem, setScoringSystem] = useState("");

	const [displayError, setDisplayError] = useState(false);
	const [errorQueue, setErrorQueue] = useState([]);
	const [currentError, setCurrentError] = useState("");

	const [displayResults, setDisplayResults] = useState(false);
	const [displayLoading, setDisplayLoading] = useState(false);

	const [results, setResults] = useState({
		entries: {},
		discardedEntries: {userHasMultiplePosts: [], postHasDuplicateEntries: [], postHasWrongEntryCount: []},
	});

	const [downloadItems, setDownloadItems] = useState(9999);
	const [downloadFormat, setDownloadFormat] = useState("csv");

	const idRegex = /^[a-z0-9]{3,8}$/;

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

		const postRegex = /^https?:\/\/(?:www\.)?reddit\.com\/r\/[a-zA-Z0-9_-]{3,20}\/comments\/([a-z0-9]{0,8})(?:\/.*)?$/u;
		const postMatches = v.match(postRegex);
		if(postMatches){
			setPostID(postMatches[1]);
			return;
		}

		const shortenedRegex = /^https?:\/\/(?:www\.)?redd\.it\/([a-z0-9]{0,8})\/?$/u;
		const shortenedMatches = v.match(shortenedRegex);
		if(shortenedMatches){
			setPostID(shortenedMatches[1]);
			return;
		}

		const idMatches = v.match(idRegex);
		if(idMatches){
			setPostID(v);
		}
		return;
	}
	const handleScoringSystem = e => {
		let v = e.target.value.trim();
		let points = v.split(",");
		try{
			points.map(x => +x.trim());
			setScoringSystem(points.join(","));
		}
		catch{
			// not a number! we need to do nothing, just don't let it happen again
		}
	}

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
		if(!postID.match(idRegex)) return false;
		if(itemsScored < 1) return false;
		if(itemsScored > 100) return false;
		const scoringSplit = scoringSystem.split(",");
		if(scoringSystem.length !== 0 && scoringSplit.length !== itemsScored) return false;
		return true;
	}

	const submit = () => {
		setDisplayResults(false);
		setDisplayLoading(true);
		const submittedPost = postID;
		if(!validateForm()){
			showError("invalid settings");
			return;
		}
		const params = new URLSearchParams();
		params.set("listType", listType);
		params.set("entryCount", itemsScored);
		params.set("entryScoring", scoringSystem);
		params.set("typoThreshold", fixTypos);
		const url = `/api/tally/${postID}?${params.toString()}`;
		fetch(url).then(r => r.json()).then(r => {
			setActivePostID(submittedPost);
			setDisplayLoading(false);
			if(r.error){
				showError(r.message);
				return;
			}
			setDisplayResults(true);
			setResults(r);
		})
	};

	const download = () => {
		const entriesRaw = Object.entries(results.entries).slice(0, downloadItems);
		const entriesReal = entriesRaw.map(x => ({entry: x[0], points: x[1].points, lists: x[1].lists}));
		const tableFix = x => x.replaceAll("|", "");
		switch(downloadFormat){
			case "csv":
				stringify(
					entriesReal,
					{
						headers: true,
						columns: {entry: "entry", points: "points", lists: "lists"}
					},
					(error, result) => {
						if(error) return showError("error while downloading csv");
						downloadFile(result, "csv");
					}
				);
				break;
			case "markdown":
				const base = "|Entry|Points|Lists|\r\n|-|-|-|\r\n";
				const entriesMD = entriesReal.map(x => `|${tableFix(x.entry)}|${x.points}|${x.lists}|`).join("\r\n");
				downloadFile(base + entriesMD, "md");
			default:
				showError("unsupported download format");
		}
	}

	const downloadFile = (contents, type) => {
		const blob = new Blob([contents]);
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `reddit-${activePostID}-results.${type}`;
		a.click();
		window.URL.revokeObjectURL(url);
	}

	useEffect(() => {
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