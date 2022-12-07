import axios from "axios";
import cookie from "cookie";
import header from "basic-auth-header";
import querystring from "querystring";
import {v4 as uuidv4} from "uuid";

export default function auth(req, res){
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
	if(Object.keys(req.query).length == 0){
		let authURL = "https://www.reddit.com/api/v1/authorize?"
		+ "client_id=" + process.env.REDDIT_CLIENT
		+ "&response_type=code"
		+ "&redirect_uri=" + encodeURIComponent(process.env.REDDIT_REDIRECT)
		+ "&duration=temporary"
		+ "&scope=read,identity";
		if(!cookies.uuid){
			const uuid = uuidv4();
			authURL += "&state=" + uuid;
			res.setHeader("Set-Cookie", cookie.serialize("uuid", uuid, {maxAge: 100 * 365 * 24 * 60 * 60, path: "/"}));
			res.redirect(307, authURL);
		}
		else{
			authURL += "&state=" + cookies.uuid;
			res.redirect(307, authURL);
		}
		return;
	}
	if(req.query.error){
		res.status(400).send(`error: ${req.query.error}`);
		return;
	}
	if(req.query.state !== cookies["uuid"]){
		res.status(400).send("error: mismatched user id while authenticating");
		return;
	}
	const authHeader = header(process.env.REDDIT_CLIENT, process.env.REDDIT_SECRET);
	const params = {
		grant_type: "authorization_code",
		code: req.query.code,
		redirect_uri: process.env.REDDIT_REDIRECT
	};
	const headers = {
		Authorization: authHeader,
		"Content-Type": "application/x-www-form-urlencoded"
	};
	axios.post("https://www.reddit.com/api/v1/access_token", querystring.stringify(params), {headers}).then(response => {
		if(response.data.error){
			res.status(400).send(`error: ${response.data.error}`);
		}
		else{
			const token = response.data.access_token;
			res.setHeader("Set-Cookie", cookie.serialize("token", token, {maxAge: response.data.expires_in, path: "/"}));
			res.redirect(307, "/");
		}
	}).catch(e => {
		res.status(400).send(`error: the reddit api returned an invalid response`);
	})
}