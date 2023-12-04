// simple file download utility
export default function downloadFile(contents: string, postId: string, fileType: string){
	// create a blob to download in, then add a fake link element pointing to that blob, then click on that link
	const blob = new Blob([contents]);
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `reddit-${postId}-results.${fileType}`;
	a.click();
	window.URL.revokeObjectURL(url);
}