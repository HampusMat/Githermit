<template>
	<div id="header">
		<BaseBackButton to="/" />
		<div id="header-content">
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
@use "../scss/mixins";
@use "../scss/fonts";

#header {
	@include mixins.header;
	flex-direction: row;
	div {
		display: inline;
	}
}

#header-content {
	margin-left: 1rem;
}

#title {
	font-family: fonts.$title;
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
