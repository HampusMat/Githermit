<template>
	<div class="row">
		<div class="col fs-5 vld-parent">
			<BaseBreadcrumb
				:items="(pathArr.length === 0) ? [] : [{ name: $router.currentRoute._rawValue.params.repo, path: '/' + $router.currentRoute._rawValue.params.repo + '/tree' }].concat(pathArr.slice(0, -1).map((path_part, index) =>
				{
					return {
						name: path_part,
						path: '/' + $router.currentRoute._rawValue.params.repo + '/tree/' + pathArr.slice(0, index + 1).join('/')
					}
				}))" :active-item="(pathArr.length === 0) ? $router.currentRoute._rawValue.params.repo : pathArr[pathArr.length - 1]" />
			<RepositoryTreeTree
				:repository="$router.currentRoute._rawValue.params.repo" :path="path"
				:tree="tree" v-if="tree" />
			<RepositoryTreeBlob
				:repository="$router.currentRoute._rawValue.params.repo" :path="path"
				:content="blob_content" v-if="blob_content" />
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
import { getParam } from "../util/util";
import { Tree, TreeEntry } from "shared_types";

import BaseBreadcrumb from "../components/BaseBreadcrumb.vue";
import RepositoryTreeBlob from "../components/RepositoryTreeBlob.vue";
import RepositoryTreeTree from "../components/RepositoryTreeTree.vue";
import BaseErrorMessage from "../components/BaseErrorMessage.vue";
import Loading from "vue-loading-overlay";

export default defineComponent({
	name: "RepositoryTree",
	components: {
		BaseBreadcrumb,
		RepositoryTreeBlob,
		RepositoryTreeTree,
		Loading,
		BaseErrorMessage
	},
	props: {
		pathArr: {
			type: Array,
			required: true
		}
	},
	watch: {
		pathArr() {
			this.is_loading = true;

			this.fetchTree(getParam(this.$route.params, "repo"));
		}
	},
	setup(props) {
		const tree: Ref<TreeEntry[] | null> = ref(null);
		const blob_content: Ref<string | null> = ref(null);
		const is_loading: Ref<boolean> = ref(true);
		const fetch_failed: Ref<string> = ref("");
		const path: Ref<string | null> = ref(null);

		async function fetchTree(repository: string) {
			blob_content.value = null;
			tree.value = null;
			path.value = props.pathArr ? props.pathArr.join("/") : null;

			const tree_data = await fetchData(`repos/${repository}/tree${path.value ? "?path=" + path.value : ""}`, fetch_failed, is_loading, "tree") as Tree;

			if(tree_data) {
				if(tree_data.type === "tree" && tree_data.content instanceof Array) {
					let tree_trees = tree_data.content.filter(entry => entry.type === "tree");
					tree_trees = tree_trees.sort((a, b) => a.name.localeCompare(b.name));

					let tree_blobs = tree_data.content.filter(entry => entry.type === "blob");
					tree_blobs = tree_blobs.sort((a, b) => a.name.localeCompare(b.name));

					tree.value = tree_trees.concat(tree_blobs);
				}
				else if(typeof tree_data.content === "string") {
					blob_content.value = tree_data.content;
				}
			}
		};

		return {
			tree,
			blob_content,
			is_loading,
			fetch_failed,
			path,
			fetchTree
		};
	},
	created() {
		this.fetchTree(getParam(this.$route.params, "repo"));
	}
});
</script>

<style lang="scss" scoped>
@import "~vue-loading-overlay/dist/vue-loading.css";
</style>