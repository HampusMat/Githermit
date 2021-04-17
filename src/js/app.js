function request(method, source, data = null)
{
	return new Promise(function (resolve, reject){
		let xhr = new XMLHttpRequest(); 
		xhr.open(method, source, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(data);

		xhr.onload = function()
		{
			if(this.status >= 200 && this.status < 300){
				resolve(xhr.response);
			}
			resolve({ status: this.status, statusText: xhr.statusText });
		};
		xhr.onerror = () =>
		{
			resolve({ status: this.status, statusText: xhr.statusText });
		}
	});
}


document.addEventListener("DOMContentLoaded", async function ()
{
	const list = document.getElementById("repos");
	const repos = JSON.parse(await request("GET", "http://localhost:1337/api/v1/repos"))["data"];

	const params = new URLSearchParams(window.location.search);
	const search = params.get("q");

	for(const [key, value] of Object.entries(repos)) {
		const li = document.createElement("li");
		const repo_div = document.createElement("div");

		const repo_title = document.createElement("p");
		const link = document.createElement("a");
		link.setAttribute("href", key);
		link.appendChild(document.createTextNode(key));
		repo_title.appendChild(link);
		repo_title.classList.add("repo-title");

		const repo_last_updated = document.createElement("span");
		repo_last_updated.appendChild(document.createTextNode(`Last updated about ${value["last_updated"]} ago`));
		repo_last_updated.classList.add("repo-last-updated");

		const repo_desc = document.createElement("span");
		repo_desc.appendChild(document.createTextNode(value["description"]));
		repo_desc.classList.add("repo-desc");

		repo_div.appendChild(repo_title)
		repo_div.appendChild(repo_last_updated)
		repo_div.appendChild(repo_desc)

		li.appendChild(repo_div);

		if(search !== null) {
			if(key.indexOf(search) != -1) {
				list.appendChild(li);
			}
		}
		else {
			list.appendChild(li);
		}
	}
});