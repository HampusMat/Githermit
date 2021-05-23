<template>
	<div class="row mx-0">
		<div id="header" class="col d-flex mt-3 ms-2">
			<BaseBackButton to="/" />
			<div class="d-inline ms-3">
				<span id="title" class="fs-1">{{ title }}</span>
				<p id="about" class="mb-3 fs-4">
					{{ about }}
				</p>
			</div>
		</div>
	</div>
</template>

<script>
import BaseBackButton from "./BaseBackButton";
import { watch, reactive, toRefs } from "vue";

export default {
	name: "RepositoryHeader",
	components: {
		BaseBackButton
	},
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	setup(props)
	{
		const state = reactive({ title: String, about: String });

		watch(() =>
		{
			fetch(`http://localhost:1337/api/v1/repos/${props.repository}`)
				.then((res) => res.json())
				.then((data) =>
				{
					state.title = data["data"]["name"];
					state.about = data["data"]["description"];
				});
		});

		return {
			... toRefs(state)
		};
	}
}
</script>