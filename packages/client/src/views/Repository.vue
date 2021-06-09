<template>
	<div class="container-fluid px-0 d-flex">
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

		const fetchProjects = async(repository) => {
			console.log(repository);
			const repository_data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${repository}`)).json();
			name.value = repository_data.data.name;
			description.value = repository_data.data.description;
			has_readme.value = repository_data.data.has_readme;
		};

		return { name, description, has_readme, fetchProjects };
	},
	created() {
		this.fetchProjects(this.$router.currentRoute._rawValue.params.repo);
	}
};
</script>

<style lang="scss" scoped>
.container-fluid {
	flex-flow: column;
	height: 100vh;
}
</style>
