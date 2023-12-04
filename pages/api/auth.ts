import axios from "axios";
import cookie from "cookie";
import header from "basic-auth-header";
import querystring from "querystring";
import {v4 as uuidv4} from "uuid";
import type {NextApiRequest, NextApiResponse} from "next";

export default function auth(req: NextApiRequest, res: NextApiResponse){
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
	// if there is no query parameter set, it means that the first step of authentication must occur
	if(Object.keys(req.query).length == 0){
		// create auth url
		let authURL = "https://www.reddit.com/api/v1/authorize?"
		+ "client_id=" + process.env.REDDIT_CLIENT
		+ "&response_type=code"
		+ "&redirect_uri=" + encodeURIComponent(process.env.REDDIT_REDIRECT)
		+ "&duration=temporary"
		+ "&scope=read,identity";
		// create a uuid for best practices and associating the user with the request
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
	// everything here onwards assumes that a query parameter is set, i.e. we are on the second step of authentication
	// request error happened
	if(req.query.error){
		res.status(400).send(`error: ${req.query.error}`);
		return;
	}
	// somehow, the user received an authentication for the wrong local uuid
	// this should basically never happen
	if(req.query.state !== cookies["uuid"]){
		res.status(400).send("error: mismatched user id while authenticating");
		return;
	}
	// we are now converting an authorisation code to a token
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
			// we got a new auth token that we can save, all is well and good
			res.setHeader("Set-Cookie", cookie.serialize("token", token, {maxAge: response.data.expires_in, path: "/"}));
			res.redirect(307, "/");
		}
	}).catch(e => {
		// error while converting token
		res.status(400).send(`error: the reddit api returned an invalid response`);
	})
}