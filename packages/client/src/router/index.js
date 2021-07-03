import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
	{
		path: "/",
		name: "Home",
		component: () => import("../views/Home")
	},
	{
		path: "/:repo([a-zA-Z0-9\\.\\-_]+)",
		name: "Repository",
		component: () => import("../views/Repository"),
		props: route => ({ repository: route.params.repo }),
		children: [
			{
				path: "about",
				name: "About",
				component: () => import("../views/RepositoryAbout")
			},
			{
				path: "log",
				name: "Log",
				component: () => import("../views/RepositoryLog")
			},
			{
				path: "log/:commit([a-fA-F0-9]{40}$)",
				name: "Commit",
				component: () => import("../views/RepositoryCommit"),
				props: route => ({ commit: route.params.commit })
			},
			{
				path: "tree/:path*",
				name: "Tree",
				component: () => import("../views/RepositoryTree"),
				props: route => ({ pathArr: route.params.path ? route.params.path : [] })
			}
			/* {
				path: "",
				component: () => import("../views/RepositoryRedirect")
			} */
		]
	},
	{
		path: "/:PageNotFound(.*)*",
		component: () => import("../views/PageNotFound")
	}
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});

export default router;
