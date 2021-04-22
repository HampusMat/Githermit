import { format } from "date-fns";

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

/**
* Create an HTML element
* @param {String} tag
* 	A HTML tag
*
* @param {String} id
* 	An id
*
* @param {Array} class_list
* 	An array of classes
*
* @param {Object} attributes
* 	An object with attributes.
*
* @return {HTMLElement}
*	The resulting element
*
*/
function createElement(tag, id, class_list, attributes)
{
	const element = document.createElement(tag);

	if(id) {
		element.setAttribute("id", id);
	}

	if(class_list) {
		class_list.forEach(_class => {
			element.classList.add(_class);
		});
	}
	
	if(attributes) {
		for(const [key, value] of Object.entries(attributes)) {
			element.setAttribute(key, value);
		}
	}

	return element;
}

async function buildHeader(container, endpoint, title_text, about_text, repo_page = false)
{
	const info = JSON.parse(await request("GET", `http://localhost:1337/api/v1/${endpoint}`))["data"];

	const row_div = createElement("div", null, ["row", "mx-0"]);
	const col_div = createElement("div", "header", ["col", "d-flex", "mt-3"], null);

	const title_div = createElement("div", null, ["d-inline"]);

	let title;

	switch(repo_page) {
		case true:
			title = createElement("span", "title", ["fs-1"]);
			col_div.classList.add("ms-2");
			title_div.classList.add("ms-3");

			const back_div = createElement("div", null, ["d-inline"]);
			const back_link = createElement("a", null, null, { "href": "/" });
			const back = createBackButtonSVG();

			back_link.appendChild(back);
			back_div.appendChild(back_link);
			col_div.appendChild(back_div);
			break;
		case false:
			title = createElement("a", "title", ["fs-1"], { "href": "/" });
			col_div.classList.add("ms-4");
			break;
	}

	title.appendChild(document.createTextNode(info[title_text]));

	const about = createElement("p", "about", ["mb-3", "fs-4"]);
	about.appendChild(document.createTextNode(info[about_text]));

	title_div.appendChild(title);
	title_div.appendChild(about);

	col_div.appendChild(title_div);

	row_div.appendChild(col_div);

	container.appendChild(row_div);
}

function buildProjectsHeader(container)
{
	const row_div = createElement("div", null, ["row", "mx-0", "mt-5"]);

	// Title column
	const title_col_div = createElement("div", "projects-header", ["col", "ms-4"]);

	const projects_title = createElement("p", null, ["fs-1"]);
	projects_title.appendChild(document.createTextNode("Projects"));

	title_col_div.appendChild(projects_title);

	// Search column
	const search_col_div = createElement("div", "projects-search", ["col", "d-flex", "justify-content-end"]);

	const form = createElement("form");
	const search = createElement("input", null, null, { "type": "search", "name": "q" });
	const submit = createElement("input", null, null, { "type": "submit", "value": "Search" });
	
	form.appendChild(search);
	form.appendChild(submit);
	search_col_div.appendChild(form);
	
	row_div.appendChild(title_col_div);
	row_div.appendChild(search_col_div);

	container.appendChild(row_div);
}

async function buildProjects(container)
{
	const row_div = createElement("div", null, ["row", "mx-0"], null);
	const col_div = createElement("div", null, ["col", "ms-4"], null);
	
	const list = createElement("ul", "repos");

	const repos = JSON.parse(await request("GET", "http://localhost:1337/api/v1/repos"))["data"];

	const params = new URLSearchParams(window.location.search);
	const search = params.get("q");

	for(const [key, value] of Object.entries(repos)) {
		const li = createElement("li");
		const repo_div = createElement("div");

		const repo_title = createElement("p", null, ["fs-3"]);
		const link = createElement("a", null, null, { "href": key });

		link.appendChild(document.createTextNode(key));
		repo_title.appendChild(link);

		const repo_last_updated = createElement("span", null, ["repo-last-updated", "fs-4"]);
		repo_last_updated.appendChild(document.createTextNode(`Last updated about ${value["last_updated"]} ago`));

		const repo_desc = createElement("span", null, ["fs-4"]);
		repo_desc.appendChild(document.createTextNode(value["description"]));

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
	const row_div = createElement("div", "navbar", ["row", "mx-0"]);
	const col_div = createElement("div", "repo-navbar", ["col", "ms-4", "ps-4"]);

	const nav = createElement("nav", null, ["navbar", "navbar-expand", "navbar-dark"]);
	const nav_container = createElement("div", null, ["container-fluid", "px-0"]);
	const nav_collapse = createElement("div", null, ["collapse", "navbar-collapse"]);
	const nav_nav = createElement("ul", null, ["navbar-nav"]);

	const nav_items = ["log", "refs", "tree"];

	nav_items.forEach(item =>
	{
		const item_li = createElement("li", null, ["nav-item"]);
		const item_link = createElement("a", null, ["nav-link", "fs-3"], { "href": `/${repo}/${item}` });
		
		if(item === page) {
			item_link.classList.add("active");
			item_link.setAttribute("aria-current", "page");
		}

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

async function buildLog(container, repo)
{
	const row_div = createElement("div", null, ["row", "mx-0"], null);
	const col_div = createElement("div", null, ["col", "ms-4", "ps-4", "ps-sm-5", "mt-3"], null);
	
	const table = createElement("table", "log", ["table", "table-dark", "fs-4"]);

	const log = JSON.parse(await request("GET", `http://localhost:1337/api/v1/repos/${repo}/log`))["data"];

	const thead = createElement("thead");
	const header_tr = createElement("tr");

	["Subject", "Author", "Date", "Files", "Del/Add"].forEach(header =>
	{
		const header_th = createElement("th", null, ["text-secondary"]);
		header_th.appendChild(document.createTextNode(header));
		header_tr.appendChild(header_th);
	});

	thead.appendChild(header_tr);
	table.appendChild(thead);

	const tbody = createElement("tbody");

	log.forEach(commit =>
	{
		const tr = createElement("tr");
		const subject = createElement("td");
		subject.appendChild(document.createTextNode(commit["subject"]));

		const author = createElement("td");
		author.appendChild(document.createTextNode(commit["author"]));

		const date = createElement("td");
		date.appendChild(document.createTextNode(format(new Date(commit["date"] * 1000), "yyyy-MM-dd hh:mm")));
		
		const files_changed = createElement("td");
		files_changed.appendChild(document.createTextNode(commit["files_changed"]));

		const del_add = createElement("td");

		const deletions = createElement("span", null, ["text-danger"])
		deletions.appendChild(document.createTextNode(`-${commit["deletions"]}`));

		const insertions = createElement("span", null, ["text-success"])
		insertions.appendChild(document.createTextNode(`+${commit["insertions"]}`));

		del_add.appendChild(deletions);
		del_add.appendChild(document.createTextNode(" / "))
		del_add.appendChild(insertions);

		tr.appendChild(subject);
		tr.appendChild(author);
		tr.appendChild(date);
		tr.appendChild(files_changed);
		tr.appendChild(del_add)

		tbody.appendChild(tr);
	});
	
	table.appendChild(tbody);
	col_div.appendChild(table);
	row_div.appendChild(col_div);
	container.appendChild(row_div);
}

function createBackButtonSVG()
{
	const xmlns = "http://www.w3.org/2000/svg";

	let svg = document.createElementNS(xmlns, "svg");
	
	svg.setAttributeNS(null, "id", "back");
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
	
	return svg;
}

document.addEventListener("DOMContentLoaded", async function ()
{
	let path = window.location.pathname;

	const container = document.getElementById("container");

	if(path === "/") {
		await buildHeader(container, "info", "title", "about");
		buildProjectsHeader(container);	
		buildProjects(container);
	}

	const path_valid_and_split = /\/([a-zA-Z0-9\.\-_]+)\/([a-z]+)$/;
	if(path_valid_and_split.test(path)) {
		path = path_valid_and_split.exec(path);
		const repo = path[1];
		const page = path[2];
		
		await buildHeader(container, `repos/${repo}`, "name", "description", true);
		buildRepoNavbar(container, repo, page);
		buildLog(container, repo);
	}
});