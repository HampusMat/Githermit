<template>
	<div class="row mx-0">
		<div class="col ms-4 ps-4 ps-sm-5 mt-3 fs-5 vld-parent">
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
				:tree="tree" v-if="type === 'tree'"
				:is-loading="is_loading" />
			<RepositoryTreeBlob
				:repository="$router.currentRoute._rawValue.params.repo" :path="path"
				:content="blob_content" v-else />
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
import Loading from "vue-loading-overlay";
import { ref } from "vue";

export default {
	name: "RepositoryTree",
	components: {
		BaseBreadcrumb,
		RepositoryTreeBlob,
		RepositoryTreeTree,
		Loading
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
			this.tree = {};
			this.fetchTree(this.$router.currentRoute._rawValue.params.repo);
		}
	},
	setup(props) {
		const type = ref("");
		const tree = ref({});
		const blob_content = ref("");
		const is_loading = ref(true);
		const path = ref("");

		const fetchTree = async(repository) => {
			path.value = props.pathArr ? props.pathArr.join("/") : undefined;
			const data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${repository}/tree${path.value ? "?path=" + path.value : ""}`)).json();
			console.log(path.value);
			type.value = data.data.type;

			if(data.data.type === "tree") {
				const tree_data = data.data.tree;

				let tree_trees = Object.entries(tree_data).filter((entry) => entry[1].type === "tree");
				tree_trees = tree_trees.sort((a, b) => a[0].localeCompare(b[0]));

				let tree_blobs = Object.entries(tree_data).filter((entry) => entry[1].type === "blob");
				tree_blobs = tree_blobs.sort((a, b) => a[0].localeCompare(b[0]));

				tree.value = Object.fromEntries(tree_trees.concat(tree_blobs));
			} else {
				blob_content.value = data.data.content;
			}

			is_loading.value = false;
		};

		return {
			type,
			tree,
			blob_content,
			is_loading,
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

.row {
	height: 100%;
}
</style>
