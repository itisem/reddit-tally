function ErrorRow({username, reason}){
	return (
		<tr>
			<td>
				<a href={`https://reddit.com/u/${username}`}>
					u/{username}
				</a>
			</td>
			<td>
				{reason}
			</td>
		</tr>
	)
}

export default function Errors({results}){
	return (
		<table>
			<tbody>
				{results.discardedEntries.userHasMultiplePosts.map(x => <ErrorRow username={x.username} reason="posted multiple lists" />)}
				{results.discardedEntries.postHasDuplicateEntries.map(x => <ErrorRow username={x.username} reason="post has the same entry twice" />)}
				{results.discardedEntries.postHasWrongEntryCount.map(x => <ErrorRow username={x.username} reason="post has incorrect entry count" />)}
			</tbody>
		</table>
	)
}