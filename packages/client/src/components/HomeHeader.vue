<template>
	<div id="header" class="d-flex mt-3 mb-3 ms-2">
		<div class="d-inline ms-3">
			<span id="title" class="fs-1">{{ title }}</span>
			<p id="about" class="mb-3 fs-4">
				{{ about }}
			</p>
		</div>
	</div>
</template>

<script>
import { ref } from "vue";

export default {
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
};
</script>

<style lang="scss">
@import "../scss/fonts";

#title {
	font-family: $font-title;
	font-weight: 300;
	line-height: 0.6;
}

#about {
	font-weight: 300;
	padding-left: 1px;
}
</style>
