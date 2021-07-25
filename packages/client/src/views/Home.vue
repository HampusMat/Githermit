<template>
	<div class="container">
		<HomeHeader />
		<HomeProjectsHeader />
		<div class="row">
			<div id="projects" class="col vld-parent">
				<ul v-if="projects">
					<li v-for="(project, index) in projects" :key="index">
						<div v-if="(search !== null && project.name.includes(search)) || search == null">
							<span class="fs-3">
								<router-link :to="project.name">
									{{ project.name }}
								</router-link>
							</span>
							<span class="repo-last-updated fs-5">Last updated about {{ project.last_updated }}</span>
							<span class="fs-5">{{ project.description }}</span>
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

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import fetchData from "../util/fetch";
import { formatDistance } from "date-fns";
import { RepositorySummary } from "shared_types";

import HomeHeader from "../components/HomeHeader.vue";
import HomeProjectsHeader from "../components/HomeProjectsHeader.vue";
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "../components/BaseErrorMessage.vue";

export default defineComponent({
	name: "Home",
	components: {
		HomeHeader,
		HomeProjectsHeader,
		Loading,
		BaseErrorMessage
	},
	setup() {
		const projects: Ref<RepositorySummary[] | null> = ref(null);
		const search: Ref<string | null> = ref(null);
		const is_loading: Ref<boolean> = ref(true);
		const fetch_failed: Ref<string> = ref("");

		async function fetchProjects() {
			const projects_data = await fetchData("repos", fetch_failed, is_loading, "projects") as RepositorySummary[];

			projects_data.reduce((result: RepositorySummary[], project) => {
				if(typeof project.last_updated === "number") {
					project.last_updated = formatDistance(new Date(project.last_updated * 1000), new Date(), { addSuffix: true });
					result.push(project);
				}
				return result;
			}, []);

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
});
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "~vue-loading-overlay/dist/vue-loading.css";

.repo-last-updated {
	display: block;
	font-weight: 300;
	font-style: italic;
}

#projects {
	margin-left: 1.5rem;
	ul {
		list-style-type: none;
		padding: 0;
		margin-top: 25px;
		li {
			margin-bottom: 25px;
		}
	}
}

</style>