<template>
	<div class="container">
		<RepositoryHeader :name="name" :description="description" />
		<RepositoryNavbar
			:repository="$router.currentRoute._rawValue.params.repo" :active-page="$router.currentRoute._rawValue.path.split('/')[2]"
			:has-readme="has_readme" />
		<router-view />
	</div>
</template>

<script>
import RepositoryHeader from "@/components/RepositoryHeader";
import RepositoryNavbar from "@/components/RepositoryNavbar";
import { ref } from "vue";

export default {
	name: "Repository",
	components: {
		RepositoryHeader,
		RepositoryNavbar
	},
	setup(props) {
		const name = ref("");
		const description = ref("");
		const has_readme = ref(null);

		const fetchProjects = async(router, path) => {
			const repository = router.currentRoute._rawValue.params.repo;

			const repository_data = await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${repository}`)
				.catch(() => {
					if(path.split("/").length === 2) {
						router.replace(`/${repository}/log`);
					};
					return null;
				});

			if(repository_data) {
				const data = (await repository_data.json()).data;
				name.value = data.name;
				description.value = data.description;
				has_readme.value = data.has_readme;
			}
		};

		return { name, description, has_readme, fetchProjects };
	},
	created() {
		this.fetchProjects(this.$router, this.$route.path);
	}
};
</script>
