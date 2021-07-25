<template>
	<div class="container">
		<RepositoryHeader :name="name" :description="description" />
		<RepositoryNavbar
			:repository="$route.params.repo" :active-page="$route.path.split('/')[2]"
			:has-readme="has_readme" />
		<router-view v-if="!error" />
		<template v-else>
			{{ error }}
		</template>
	</div>
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import { Router } from "vue-router";
import { Repository } from "shared_types";
import { getParam } from "../util/util";

import RepositoryHeader from "../components/RepositoryHeader.vue";
import RepositoryNavbar from "../components/RepositoryNavbar.vue";

export default defineComponent({
	name: "Repository",
	components: {
		RepositoryHeader,
		RepositoryNavbar
	},
	setup(props) {
		const name: Ref<string> = ref("");
		const description: Ref<string | null> = ref(null);
		const has_readme: Ref<boolean> = ref(false);
		const error: Ref<string | null> = ref(null);

		async function fetchProjects(repository: string, router: Router, path: string) {
			const repository_data = await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${repository}`);

			if(!repository_data.ok) {
				error.value = repository_data.status === 404
					? "404: Not found"
					: "Unknown error has occurred!";

				return;
			}

			if(path.split("/").length === 2) {
				router.replace(`/${repository}/log`);
			}

			const data: Repository = (await repository_data.json()).data;

			name.value = data.name;
			description.value = data.description;
			has_readme.value = data.has_readme;
		};

		return { name, description, has_readme, fetchProjects, error };
	},
	created() {
		this.fetchProjects(getParam(this.$route.params, "repo"), this.$router, this.$route.path);
	}
});
</script>