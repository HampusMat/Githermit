<template>
	<div id="header" class="mx-0 d-flex mt-3 ms-2">
		<BaseBackButton to="/" />
		<div class="d-inline ms-3">
			<span id="title" class="fs-1">{{ name }}</span>
			<p id="about" class="fs-4">
				{{ description }}
			</p>
		</div>
	</div>
</template>

<script>
import BaseBackButton from "@/components/BaseBackButton";
import { ref } from "vue";

export default {
	name: "RepositoryHeader",
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	components: {
		BaseBackButton
	},
	setup(props) {
		const name = ref("");
		const description = ref("");

		const fetchProjects = async() => {
			const repository_data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${props.repository}`)).json();
			name.value = repository_data.data.name;
			description.value = repository_data.data.description;
		};

		return { name, description, fetchProjects };
	},
	created() {
		this.fetchProjects();
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";

@import "../scss/bootstrap";
@import "../scss/fonts";

#title {
	font-family: $font-title;
	font-weight: 300;
	line-height: 0.6;
}

#about {
	font-weight: 300;
	padding-left: 1px;
	margin: 0px;
	margin-top: 10px;
}
</style>
