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

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import fetchData from "../util/fetch";
import { Tree } from "shared_types";
import { getParam } from "../util/util";

import RepositoryTreeBlob from "../components/RepositoryTreeBlob.vue";
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "../components/BaseErrorMessage.vue";

export default defineComponent({
	name: "RepositoryAbout",
	components: {
		RepositoryTreeBlob,
		Loading,
		BaseErrorMessage
	},
	setup(props) {
		const readme: Ref<string | null> = ref(null);
		const is_loading: Ref<boolean> = ref(true);
		const fetch_failed: Ref<string> = ref("");

		const fetchReadme = async(repository: string) => {
			const readme_data: Tree = await fetchData(`repos/${repository}/tree?path=README.md`, fetch_failed, is_loading, "tree");

			if(readme_data && typeof readme_data.content === "string") {
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
		this.fetchReadme(getParam(this.$route.params, "repo"));
	}
});
</script>

<style lang="scss" scoped>
@import "~vue-loading-overlay/dist/vue-loading.css";
</style>
