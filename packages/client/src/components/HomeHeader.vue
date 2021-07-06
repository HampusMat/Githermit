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

export default defineComponent({
	name: "HomeHeader",
	setup() {
		const title = ref("");
		const about = ref("");

		const fetchInfo = async() => {
			const data = await (await fetch(`${window.location.protocol}//${window.location.host}/api/v1/info`)).json();
			console.log(data.data);
			title.value = data.data.title;
			about.value = data.data.about;
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
