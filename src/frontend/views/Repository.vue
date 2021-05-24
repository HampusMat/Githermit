<template>
	<RepositoryHeader :repository="repository" />
	<router-view :repository="repository" />
</template>

<script>
import RepositoryHeader from "../components/RepositoryHeader";

export default {
	name: "Repository",
	components: {
		RepositoryHeader
	},
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	created()
	{
		if(/^\/[a-zA-Z0-9.\-_]+[/]?$/.test(window.location.pathname)) {
			this.$router.push({ path: `${window.location.pathname}${( window.location.pathname.endsWith("/") ) ? "log" : "/log"}`, replace: true});
		}

		console.log(this.repository);
	}
}
</script>