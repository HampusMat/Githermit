import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home";
import Repository from "../views/Repository";
import RepositoryLog from "../views/RepositoryLog";
import RepositoryCommit from "../views/RepositoryCommit";

const routes = [
	{
		name: "Home",
		path: "/",
		component: Home
	},
	{
		name: "Repository",
		path: '/:repo([a-zA-Z0-9\\.\\-_]+)',
		component: Repository,
		props: route => ({ repository: route.params.repo }),
		children: [
			{
				name: "Repository Log",
				path: "log",
				component: RepositoryLog,
			},
			{
				name: "Commit",
				path: "log/:commit([a-fA-F0-9]{40}$)",
				component: RepositoryCommit,
				props: route => ({ commit: route.params.commit })
			}
		]
	}
]

const router = createRouter({
	history: createWebHistory(process.env.BASE_URL),
	routes
});

export default router;