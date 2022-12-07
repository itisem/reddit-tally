import Snoowrap from "snoowrap";
import cookie from "cookie";

export default function me(req, res){
	const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
	if(!cookies.token) res.status(400).json({error: true, message: "no token cookie"});
	const r = new Snoowrap({
		userAgent: "reddit-tally",
		accessToken: cookies.token
	});
	r.getMe().then(response => {
		if(response.name) res.json({error: false, displayName: response.name})
		else res.status(400).json({error: true, message: "invalid token"});
	});
}