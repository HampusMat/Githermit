onmessage = function(e)
{
	if(e.data.work === "sleep") {
		setTimeout(() => { postMessage("done") }, e.data.time);
	}
}