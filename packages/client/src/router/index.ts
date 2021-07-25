import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
	{
		path: "/",
		name: "Home",
		component: () => import("../views/Home.vue")
	},
	{
		path: "/:repo([a-zA-Z0-9\\.\\-_]+)",
		name: "Repository",
		component: () => import("../views/Repository.vue"),
		props: route => ({ repository: route.params.repo }),
		children: [
			{
				path: "about",
				name: "About",
				component: () => import("../views/RepositoryAbout.vue")
			},
			{
				path: "log",
				name: "Log",
				component: () => import("../views/RepositoryLog.vue")
			},
			{
				path: "log/:commit([a-fA-F0-9]{40}$)",
				name: "Commit",
				component: () => import("../views/RepositoryCommit.vue"),
				props: route => ({ commit: route.params.commit })
			},
			{
				path: "tree/:path*",
				name: "Tree",
				component: () => import("../views/RepositoryTree.vue"),
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
		component: () => import("../views/PageNotFound.vue")
	}
];

const router = createRouter({
	history: createWebHashHistory(),
	routes
});

export default router;