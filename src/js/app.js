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

async function buildHeader(container, endpoint, title_text, about_text, repo_page = false)
{
	const info = JSON.parse(await request("GET", `http://localhost:1337/api/v1/${endpoint}`))["data"];

	const row_div = document.createElement("div");
	row_div.classList.add("row", "mx-0");

	const col_div = document.createElement("div");
	col_div.classList.add("col", "ms-4", "mt-2");
	col_div.setAttribute("id", "header");

	const title = document.createElement("a");
	title.classList.add("fs-1");
	title.setAttribute("id", "title");
	title.setAttribute("href", "/");
	title.appendChild(document.createTextNode(info[title_text]));

	const about = document.createElement("p");
	about.setAttribute("id", "about");
	about.classList.add("mb-3", "fs-4")
	about.appendChild(document.createTextNode(info[about_text]));

	col_div.appendChild(title);
	col_div.appendChild(about);

	if(repo_page) {
		buildBackSVG(col_div);
	}

	row_div.appendChild(col_div);

	container.appendChild(row_div);
}

function buildProjectsHeader(container)
{
	const row_div = document.createElement("div");
	row_div.classList.add("row", "mx-0", "mt-5");

	// Title column
	const title_col_div = document.createElement("div");
	title_col_div.classList.add("col", "ms-4");
	title_col_div.setAttribute("id", "projects-header");

	const projects_title = document.createElement("p");
	projects_title.classList.add("fs-1");
	projects_title.appendChild(document.createTextNode("Projects"));

	title_col_div.appendChild(projects_title);

	// Search column
	const search_col_div = document.createElement("div");
	search_col_div.classList.add("col", "d-flex", "justify-content-end");
	search_col_div.setAttribute("id", "projects-search");

	const form = document.createElement("form");
	const search = document.createElement("input");
	search.setAttribute("type", "search");
	search.setAttribute("name", "q");
	const submit = document.createElement("input");
	submit.setAttribute("type", "submit");
	submit.setAttribute("value", "Search");
	
	form.appendChild(search);
	form.appendChild(submit);
	search_col_div.appendChild(form);
	
	row_div.appendChild(title_col_div);
	row_div.appendChild(search_col_div);

	container.appendChild(row_div);
}

async function buildProjects(container)
{
	const row_div = document.createElement("div");
	row_div.classList.add("row", "mx-0");

	const col_div = document.createElement("div");
	col_div.classList.add("col", "ms-4");
	
	const list = document.createElement("ul");
	list.setAttribute("id", "repos");

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
		repo_title.classList.add("fs-3");

		const repo_last_updated = document.createElement("span");
		repo_last_updated.appendChild(document.createTextNode(`Last updated about ${value["last_updated"]} ago`));
		repo_last_updated.classList.add("repo-last-updated", "fs-4");

		const repo_desc = document.createElement("span");
		repo_desc.appendChild(document.createTextNode(value["description"]));
		repo_desc.classList.add("fs-4");

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

	col_div.appendChild(list);
	row_div.appendChild(col_div);
	container.appendChild(row_div);
}

function buildRepoNavbar(container, repo, page)
{
	const row_div = document.createElement("div");
	row_div.classList.add("row", "mx-0");

	const col_div = document.createElement("div");
	col_div.classList.add("col", "ms-3");
	col_div.setAttribute("id", "repo-navbar");

	const nav = document.createElement("nav");
	nav.classList.add("navbar", "navbar-expand", "navbar-dark");

	const nav_container = document.createElement("div");
	nav_container.classList.add("container-fluid", "px-0");

	const nav_collapse = document.createElement("div");
	nav_collapse.classList.add("collapse", "navbar-collapse");

	const nav_nav = document.createElement("ul");
	nav_nav.classList.add("navbar-nav");

	const nav_items = ["log", "refs", "tree"];

	nav_items.forEach(item =>
	{
		const item_li = document.createElement("li");
		item_li.classList.add("nav-item");

		const item_link = document.createElement("a");
		item_link.classList.add("nav-link", "fs-3");
		if(item === page) {
			item_link.classList.add("active");
			item_link.setAttribute("aria-current", "page");
		}
		item_link.setAttribute("href", `/${repo}/${item}`);
		item_link.appendChild(document.createTextNode(item));

		item_li.appendChild(item_link);
		
		nav_nav.appendChild(item_li);
	});

	nav_collapse.appendChild(nav_nav);
	nav_container.appendChild(nav_collapse);
	nav.appendChild(nav_container);
	col_div.appendChild(nav);
	row_div.appendChild(col_div);
	container.appendChild(row_div);
}

function buildBackSVG(container)
{
	const xmlns = "http://www.w3.org/2000/svg";

	let svg = document.createElementNS(xmlns, "svg");
	
	svg.setAttributeNS(null, "height", "24px");
	svg.setAttributeNS(null, "width", "24px");
	svg.setAttributeNS(null, "viewBox", "0 0 24 24");
	svg.setAttributeNS(null, "fill", "#FFFFFF");

	const path_one = document.createElementNS(xmlns, "path");
	path_one.setAttributeNS(null, "d", "M0 0h24v24H0z");
	path_one.setAttributeNS(null, "fill", "none");

	const path_two = document.createElementNS(xmlns, "path");
	path_two.setAttributeNS(null, "d", "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z");

	svg.appendChild(path_one);
	svg.appendChild(path_two);
	container.appendChild(svg);
}

document.addEventListener("DOMContentLoaded", async function ()
{
	let path = window.location.pathname;

	if(path === "/") {
		const container = document.getElementById("container");
		await buildHeader(container, "info", "title", "about");
		buildProjectsHeader(container);	
		buildProjects(container);
	}

	const path_valid_and_split = /\/([a-zA-Z0-9\.\-_]+)\/([a-z]+)$/;
	if(path_valid_and_split.test(path)) {
		path = path_valid_and_split.exec(path);
		const repo = path[1];
		const page = path[2];
		
		const container = document.getElementById("container");

		await buildHeader(container, `repos/${repo}`, "name", "description", true);
		buildRepoNavbar(container, repo, page);
	}
});