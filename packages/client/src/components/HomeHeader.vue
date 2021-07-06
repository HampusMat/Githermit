<template>
	<div id="header">
		<span id="title" class="fs-1">{{ title }}</span>
		<p id="about" class="fs-4">
			{{ about }}
		</p>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { Info } from "shared_types";

export default defineComponent({
	name: "HomeHeader",
	setup() {
		const title = ref("");
		const about = ref("");

		const fetchInfo = async() => {
			const info: Info = (await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/info`)).json()).data;

			title.value = info.title;
			about.value = info.about;
		};

		return { title, about, fetchInfo };
	},
	mounted() {
		this.fetchInfo();
	}
});
</script>

<style lang="scss" scoped>
@use "../scss/mixins";
@use "../scss/fonts";

#header {
	@include mixins.header;
	flex-direction: column;
}

#title {
	font-family: fonts.$title;
	font-weight: 300;
	line-height: 0.6;
}

#about {
	font-weight: 300;
	padding-left: 1px;
}
</style>
