<template>
	<div class="row mx-0">
		<div id="header" class="col d-flex mt-3 ms-2">
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
import { watch, reactive, toRefs } from "vue";

export default {
	name: "HomeHeader",
	setup()
	{
		const state = reactive({ title: String, about: String });

		watch(() =>
		{
			fetch(`http://localhost:1337/api/v1/info`)
				.then((res) => res.json())
				.then((data) =>
				{
					state.title = data["data"]["title"],
					state.about = data["data"]["about"]
				});
		});

		return {
			... toRefs(state)
		};
	}
}
</script>