import Snoowrap from "snoowrap";
import cookie from "cookie";

import type {NextApiRequest, NextApiResponse} from "next";

/** gets user info based on the tokens */
export default function me(req: NextApiRequest, res: NextApiResponse){
	// ensure that there is a token in the cookies
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
	if(!cookies.token) res.status(400).json({error: true, message: "no token cookie"});
	// try to get the user's own information from reddit, error if it fails
	const r = new Snoowrap({
		userAgent: "reddit-tally",
		accessToken: cookies.token
	});
	r.getMe().then(response => {
		if(response.name) res.json({error: false, displayName: response.name})
		else res.status(400).json({error: true, message: "invalid token"});
	});
}