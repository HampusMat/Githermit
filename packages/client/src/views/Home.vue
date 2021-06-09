<template>
	<div class="container-fluid px-0 d-flex">
		<HomeHeader />
		<HomeProjectsHeader />
		<div class="row mx-0">
			<div class="col ms-4 vld-parent">
				<ul id="repos" v-if="projects">
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
				<BaseErrorMessage :fetch-failed="fetch_failed" />
				<Loading
					:active="is_loading" :height="24"
					:width="24" color="#ffffff"
					:opacity="0" :is-full-page="false" />
			</div>
		</div>
	</div>
</template>

<script>
import HomeHeader from "@/components/HomeHeader";
import HomeProjectsHeader from "@/components/HomeProjectsHeader";
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "@/components/BaseErrorMessage";
import fetchData from "@/util/fetch";
import { ref } from "vue";

export default {
	name: "Home",
	components: {
		HomeHeader,
		HomeProjectsHeader,
		Loading,
		BaseErrorMessage
	},
	setup() {
		const projects = ref({});
		const search = ref("");
		const is_loading = ref(true);
		const fetch_failed = ref(null);

		const fetchProjects = async() => {
			const projects_data = await fetchData("repos", fetch_failed, is_loading, "projects");
			projects.value = projects_data;
		};

		search.value = (new URLSearchParams(window.location.search)).get("q");

		return { projects, search, is_loading, fetch_failed, fetchProjects };
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
@import "~vue-loading-overlay/dist/vue-loading.css";

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

.row {
	height: 100%;
}
</style>
