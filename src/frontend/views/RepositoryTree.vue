<template>
	<RepositoryNavbar active-page="tree" :repository="repository" />
	<div class="row mx-0 vld-parent">
		<Loading
			v-model:active="is_loading" :height="24"
			:width="24" color="#ffffff"
			:opacity="0" />
		<div class="col ms-4 ps-4 ps-sm-5 mt-3 fs-5">
			<BaseBreadcrumb
				:items="[{ name: repository, path: '/' + repository + '/tree' }].concat(pathArr.slice(0, -1).map((path_part, index) =>
				{
					return {
						name: path_part,
						path: '/' + repository + '/tree/' + pathArr.slice(0, index + 1).join('/')
					}
				}))" :active-item="pathArr[pathArr.length - 1]" />
			<RepositoryTreeTree
				:repository="repository" :path="path"
				:tree="tree" v-if="type === 'tree'" />
			<RepositoryTreeBlob
				:repository="repository" :path="path"
				:content="blob_content" v-else />
		</div>
	</div>
</template>

<script>
import RepositoryNavbar from "../components/RepositoryNavbar";
import RepositoryTreeTree from "../components/RepositoryTreeTree";
import RepositoryTreeBlob from "../components/RepositoryTreeBlob";
import BaseBreadcrumb from "../components/BaseBreadcrumb";
import Loading from "vue-loading-overlay";
import 'vue-loading-overlay/dist/vue-loading.css';
import { ref } from "vue";

export default {
	name: "RepositoryTree",
	components: {
		RepositoryNavbar,
		Loading,
		RepositoryTreeTree,
		RepositoryTreeBlob,
		BaseBreadcrumb
	},
	props: {
		repository: {
			type: String,
			required: true
		},
		pathArr: {
			type: Array,
			required: true
		}
	},
	watch: {
		pathArr()
		{
			this.fetchTree();
		}
	},
	setup(props)
	{
		const type = ref("");
		const tree = ref({});
		const blob_content = ref("");
		const is_loading = ref(true);
		const path = ref("");

		const fetchTree = async () =>
		{
			path.value = props.pathArr ? props.pathArr.join("/") : undefined;
			const data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${props.repository}/tree${path.value ? "?path=" + path.value : ""}`)).json();
			
			console.log(path.value);
			type.value = data["data"]["type"];

			if(data["data"]["type"] === "tree") {
				const tree_data = data["data"]["tree"];

				let tree_trees = Object.entries(tree_data).filter((entry) => entry[1].type === "tree");
				tree_trees = tree_trees.sort((a, b) => a[0].localeCompare(b[0]));

				let tree_blobs = Object.entries(tree_data).filter((entry) => entry[1].type === "blob");
				tree_blobs = tree_blobs.sort((a, b) => a[0].localeCompare(b[0]));

				tree.value = Object.fromEntries(tree_trees.concat(tree_blobs));
			}
			else {
				blob_content.value = data["data"]["content"];
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
	mounted()
	{
		console.log("VAFAAAN öaöaöaö");
		this.fetchTree();
	}
};
</script>