// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function(modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x) {
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function(id, exports) {
    modules[id] = [
      function(require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function() {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function() {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"4KKVL":[function(require,module,exports) {
var HMR_HOST = null;
var HMR_PORT = 1234;
var HMR_SECURE = false;
var HMR_ENV_HASH = "d751713988987e9331980363e24189ce";
module.bundle.HMR_BUNDLE_ID = "45f70d85e946827dd417192a9232838b";
// @flow
/*global HMR_HOST, HMR_PORT, HMR_ENV_HASH, HMR_SECURE*/
/*::
import type {
HMRAsset,
HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
(string): mixed;
cache: {|[string]: ParcelModule|};
hotData: mixed;
Module: any;
parent: ?ParcelRequire;
isParcelRequire: true;
modules: {|[string]: [Function, {|[string]: string|}]|};
HMR_BUNDLE_ID: string;
root: ParcelRequire;
}
interface ParcelModule {
hot: {|
data: mixed,
accept(cb: (Function) => void): void,
dispose(cb: (mixed) => void): void,
// accept(deps: Array<string> | string, cb: (Function) => void): void,
// decline(): void,
_acceptCallbacks: Array<(Function) => void>,
_disposeCallbacks: Array<(mixed) => void>,
|};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
*/
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || (function () {}));
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = undefined;
}
module.bundle.Module = Module;
var checkedAssets, /*: {|[string]: boolean|}*/
acceptedAssets, /*: {|[string]: boolean|}*/
/*: {|[string]: boolean|}*/
assetsToAccept;
function getHostname() {
  return HMR_HOST || (location.protocol.indexOf('http') === 0 ? location.hostname : 'localhost');
}
function getPort() {
  return HMR_PORT || location.port;
}
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = getHostname();
  var port = getPort();
  var protocol = HMR_SECURE || location.protocol == 'https:' && !(/localhost|127.0.0.1|0.0.0.0/).test(hostname) ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + (port ? ':' + port : '') + '/');
  // $FlowFixMe
  ws.onmessage = function (event) /*: {data: string, ...}*/
  {
    checkedAssets = {
      /*: {|[string]: boolean|}*/
    };
    acceptedAssets = {
      /*: {|[string]: boolean|}*/
    };
    assetsToAccept = [];
    var data = /*: HMRMessage*/
    JSON.parse(event.data);
    if (data.type === 'update') {
      // Remove error overlay if there is one
      removeErrorOverlay();
      let assets = data.assets.filter(asset => asset.envHash === HMR_ENV_HASH);
      // Handle HMR Update
      var handled = false;
      assets.forEach(asset => {
        var didAccept = asset.type === 'css' || asset.type === 'js' && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
        if (didAccept) {
          handled = true;
        }
      });
      if (handled) {
        console.clear();
        assets.forEach(function (asset) {
          hmrApply(module.bundle.root, asset);
        });
        for (var i = 0; i < assetsToAccept.length; i++) {
          var id = assetsToAccept[i][1];
          if (!acceptedAssets[id]) {
            hmrAcceptRun(assetsToAccept[i][0], id);
          }
        }
      } else {
        window.location.reload();
      }
    }
    if (data.type === 'error') {
      // Log parcel errors to console
      for (let ansiDiagnostic of data.diagnostics.ansi) {
        let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
        console.error('🚨 [parcel]: ' + ansiDiagnostic.message + '\n' + stack + '\n\n' + ansiDiagnostic.hints.join('\n'));
      }
      // Render the fancy html overlay
      removeErrorOverlay();
      var overlay = createErrorOverlay(data.diagnostics.html);
      // $FlowFixMe
      document.body.appendChild(overlay);
    }
  };
  ws.onerror = function (e) {
    console.error(e.message);
  };
  ws.onclose = function (e) {
    if (undefined !== 'test') {
      console.warn('[parcel] 🚨 Connection to the HMR server was lost');
    }
  };
}
function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
    console.log('[parcel] ✨ Error resolved');
  }
}
function createErrorOverlay(diagnostics) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
  for (let diagnostic of diagnostics) {
    let stack = diagnostic.codeframe ? diagnostic.codeframe : diagnostic.stack;
    errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          🚨 ${diagnostic.message}
        </div>
        <pre>
          ${stack}
        </pre>
        <div>
          ${diagnostic.hints.map(hint => '<div>' + hint + '</div>').join('')}
        </div>
      </div>
    `;
  }
  errorHTML += '</div>';
  overlay.innerHTML = errorHTML;
  return overlay;
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]>*/
{
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }
  var parents = [];
  var k, d, dep;
  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push([bundle, k]);
      }
    }
  }
  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }
  return parents;
}
function updateLink(link) {
  var newLink = link.cloneNode();
  newLink.onload = function () {
    if (link.parentNode !== null) {
      // $FlowFixMe
      link.parentNode.removeChild(link);
    }
  };
  newLink.setAttribute('href', // $FlowFixMe
  link.getAttribute('href').split('?')[0] + '?' + Date.now());
  // $FlowFixMe
  link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
  if (cssTimeout) {
    return;
  }
  cssTimeout = setTimeout(function () {
    var links = document.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
      // $FlowFixMe[incompatible-type]
      var href = /*: string*/
      links[i].getAttribute('href');
      var hostname = getHostname();
      var servedFromHMRServer = hostname === 'localhost' ? new RegExp('^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):' + getPort()).test(href) : href.indexOf(hostname + ':' + getPort());
      var absolute = (/^https?:\/\//i).test(href) && href.indexOf(window.location.origin) !== 0 && !servedFromHMRServer;
      if (!absolute) {
        updateLink(links[i]);
      }
    }
    cssTimeout = null;
  }, 50);
}
function hmrApply(bundle, /*: ParcelRequire*/
asset) /*:  HMRAsset*/
{
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (asset.type === 'css') {
    reloadCSS();
    return;
  }
  let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
  if (deps) {
    var fn = new Function('require', 'module', 'exports', asset.output);
    modules[asset.id] = [fn, deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}
function hmrAcceptCheck(bundle, /*: ParcelRequire*/
id, /*: ParcelRequire*/
/*: string*/
depsByBundle) /*: ?{ [string]: { [string]: string } }*/
{
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
    // If we reached the root bundle without finding where the asset should go,
    // there's nothing to do. Mark as "accepted" so we don't reload the page.
    if (!bundle.parent) {
      return true;
    }
    return hmrAcceptCheck(bundle.parent, id, depsByBundle);
  }
  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }
  return getParents(module.bundle.root, id).some(function (v) {
    return hmrAcceptCheck(v[0], v[1], null);
  });
}
function hmrAcceptRun(bundle, /*: ParcelRequire*/
id) /*: string*/
{
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached && cached.hot) {
    cached.hot.data = bundle.hotData;
  }
  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }
  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      var assetsToAlsoAccept = cb(function () {
        return getParents(module.bundle.root, id);
      });
      if (assetsToAlsoAccept && assetsToAccept.length) {
        assetsToAccept.push.apply(assetsToAccept, assetsToAlsoAccept);
      }
    });
  }
  acceptedAssets[id] = true;
}

},{}],"6Q6as":[function(require,module,exports) {
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
},{}]},["4KKVL","6Q6as"], "6Q6as", "parcelRequire0364")

