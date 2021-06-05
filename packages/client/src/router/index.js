import { createRouter, createWebHashHistory } from "vue-router";
import Home from "../views/Home";

const routes = [
	{
		path: "/",
		name: "Home",
		component: Home
	},
	{
		path: "/:repo([a-zA-Z0-9\\.\\-_]+)",
		name: "Repository",
		component: () => import("../views/Repository"),
		props: route => ({ repository: route.params.repo }),
		children: [
			{
				path: "log",
				name: "Repository Log",
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
				name: "Tree Entry",
				component: () => import("../views/RepositoryTree"),
				props: route => ({ pathArr: route.params.path ? route.params.path : [] })
			},
			{
				path: "",
				redirect: to => `/${to.params.repo}/log`
			}
		]
	}
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});

export default router;
