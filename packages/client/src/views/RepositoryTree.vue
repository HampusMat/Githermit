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

<script>
import BaseBreadcrumb from "@/components/BaseBreadcrumb";
import RepositoryTreeBlob from "@/components/RepositoryTreeBlob";
import RepositoryTreeTree from "@/components/RepositoryTreeTree";
import BaseErrorMessage from "@/components/BaseErrorMessage";
import Loading from "vue-loading-overlay";
import { ref } from "vue";
import fetchData from "@/util/fetch";

export default {
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
			this.fetchTree(this.$router.currentRoute._rawValue.params.repo);
		}
	},
	setup(props) {
		const tree = ref(null);
		const blob_content = ref(null);
		const is_loading = ref(true);
		const fetch_failed = ref(null);
		const path = ref("");

		const fetchTree = async(repository) => {
			blob_content.value = null;
			tree.value = null;

			path.value = props.pathArr ? props.pathArr.join("/") : undefined;

			const tree_data = await fetchData(`repos/${repository}/tree${path.value ? "?path=" + path.value : ""}`, fetch_failed, is_loading, "tree");

			if(tree_data) {
				if(tree_data.type === "tree") {
					let tree_trees = Object.entries(tree_data.tree).filter((entry) => entry[1].type === "tree");
					tree_trees = tree_trees.sort((a, b) => a[0].localeCompare(b[0]));

					let tree_blobs = Object.entries(tree_data.tree).filter((entry) => entry[1].type === "blob");
					tree_blobs = tree_blobs.sort((a, b) => a[0].localeCompare(b[0]));

					tree.value = Object.fromEntries(tree_trees.concat(tree_blobs));
					console.log(tree.value);
				} else {
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
		this.fetchTree(this.$router.currentRoute._rawValue.params.repo);
	}
};
</script>

<style lang="scss" scoped>
@import "~vue-loading-overlay/dist/vue-loading.css";
</style>
