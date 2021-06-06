<template>
	<div class="container-fluid px-0 d-flex">
		<HomeHeader />
		<HomeProjectsHeader />
		<div class="row mx-0">
			<div class="col ms-4">
				<ul id="repos">
					<li v-for="(project, project_name, index) in projects" :key="index">
						<div v-if="(search !== null && project_name.includes(search)) || search == null">
							<span class="fs-3">
								<router-link :to="project_name">
									{{ project_name }}
								</router-link>
							</span>
							<span class="repo-last-updated fs-5">Last updated about {{ project["last_updated"] }} ago</span>
							<span class="fs-5">{{ project["description"] }}</span>
						</div>
					</li>
				</ul>
			</div>
		</div>
	</div>
</template>

<script>
import HomeHeader from "@/components/HomeHeader";
import HomeProjectsHeader from "@/components/HomeProjectsHeader";
import { ref } from "vue";

export default {
	name: "Home",
	components: {
		HomeHeader,
		HomeProjectsHeader
	},
	setup() {
		const projects = ref({});
		const search = ref("");

		const fetchProjects = async() => {
			const projects_data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos`)).json();
			projects.value = projects_data.data;
		};

		search.value = (new URLSearchParams(window.location.search)).get("q");

		return { projects, search, fetchProjects };
	},
	mount() {
		this.fetchProjects();
	},
	created() {
		this.fetchProjects();
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "../scss/bootstrap";

#repos {
	margin-top: 25px;
	li {
		margin-bottom: 25px;
	}
}

.repo-last-updated {
	display: block;
	font-weight: 300;
	font-style: italic;
}

ul {
	list-style-type: none;
	padding: 0;
}

.container-fluid {
	flex-flow: column;
	height: 100vh;
}
</style>
