<template>
	<div class="row">
		<div class="col fs-5 vld-parent">
			<RepositoryTreeBlob
				:repository="$router.currentRoute._rawValue.params.repo" path="README.md"
				:content="readme" v-if="readme" />
			<BaseErrorMessage :fetch-failed="fetch_failed" />
			<Loading
				:active="is_loading" :height="24"
				:width="24" color="#ffffff"
				:opacity="0" :is-full-page="false" />
		</div>
	</div>
</template>

<script>
import RepositoryTreeBlob from "@/components/RepositoryTreeBlob";
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "@/components/BaseErrorMessage";
import { ref } from "vue";
import fetchData from "@/util/fetch";

export default {
	name: "RepositoryAbout",
	components: {
		RepositoryTreeBlob,
		Loading,
		BaseErrorMessage
	},
	setup(props) {
		const readme = ref(null);
		const is_loading = ref(true);
		const fetch_failed = ref(null);

		const fetchReadme = async(repository) => {
			const readme_data = await fetchData(`repos/${repository}/tree?path=README.md`, fetch_failed, is_loading, "tree");

			if(readme_data) {
				readme.value = readme_data.content;
			}
		};

		return {
			readme,
			is_loading,
			fetch_failed,
			fetchReadme
		};
	},
	created() {
		this.fetchReadme(this.$router.currentRoute._rawValue.params.repo);
	}
};
</script>

<style lang="scss" scoped>
@import "~vue-loading-overlay/dist/vue-loading.css";
</style>
