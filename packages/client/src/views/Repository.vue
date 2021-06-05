<template>
	<div class="container-fluid px-0 d-flex">
		<RepositoryHeader :repository="$router.currentRoute._rawValue.params.repo" />
		<RepositoryNavbar :repository="$router.currentRoute._rawValue.params.repo" :active-page="$router.currentRoute._rawValue.path.split('/')[2]" />
		<router-view />
	</div>
</template>

<script>
import RepositoryHeader from "@/components/RepositoryHeader";
import RepositoryNavbar from "@/components/RepositoryNavbar";

export default {
	name: "Repository",
	components: {
		RepositoryHeader,
		RepositoryNavbar
	}
};
</script>

<style lang="scss" scoped>
.container-fluid {
	flex-flow: column;
	height: 100vh;
}
</style>
