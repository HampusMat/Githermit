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

export default {
	name: "RepositoryHeader",
	props: {
		name: {
			type: String,
			required: true
		},
		description: {
			type: String,
			required: true
		}
	},
	components: {
		BaseBackButton
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
