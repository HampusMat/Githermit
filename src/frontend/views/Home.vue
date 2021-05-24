<template>
	<HomeHeader />
	<div class="row mx-0 mt-5">
		<div id="projects-header" class="col ms-4">
			<p class="fs-1">
				Projects
			</p>
		</div>
		<div id="projects-search" class="col d-flex justify-content-end">
			<form>
				<input type="search" name="q">
				<input type="submit" value="Search">
			</form>
		</div>
	</div>
	<div class="row mx-0">
		<div class="col ms-4">
			<ul id="repos">
				<li v-for="(project, project_name, index) in projects" :key="index">
					<div v-if="(search !== null && project_name.includes(search)) || search == null">
						<p class="fs-3">
							<router-link :to="project_name">
								{{ project_name }}
							</router-link>
						</p>
						<span class="repo-last-updated fs-5">Last updated about {{ project["last_updated"] }} ago</span>
						<span class="fs-5">{{ project["description"] }}</span>
					</div>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
import HomeHeader from "../components/HomeHeader";
import { watch, reactive, toRefs } from "vue";

export default {
	name: "Home",
	components: {
		HomeHeader
	},
	setup()
	{
		const state = reactive({ projects: Object, search: String });

		watch(() =>
		{
			fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos`)
				.then((res) => res.json())
				.then((data) => state.projects = data["data"]);
		});

		state.search = (new URLSearchParams(window.location.search)).get("q");

		return {
			... toRefs(state)
		};
	}
}
</script>