<template>
	<router-view />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { RouteLocation } from "vue-router";

export default defineComponent({
	name: "App",
	data: function() {
		return {
			base_title: ""
		};
	},
	methods: {
		setTitle() {
			const route: RouteLocation = this.$route;

			document.title = route.params.repo ? `${route.params.repo} - ${route.name?.toString()}` : this.base_title;
		}
	},
	created() {
		this.base_title = document.title;
		this.setTitle();
	},
	watch: {
		$route() {
			this.setTitle();
		}
	}
});
</script>

<style lang="scss">
@use "scss/colors";
@use "scss/variables";
@use "scss/fonts";

$gutter-x: 1.5rem;
$gutter-y: 0rem;

#app {
	font-family: fonts.$primary;
	color: colors.$text;
	min-height: 100vh;
	background-color: colors.$background;
}

a {
	color: colors.$text;
	text-decoration: none;
	transition: color 0.15s ease-in-out;
	&:hover {
		color: colors.$primary-light;
	}
}

.container {
	display: flex;
	width: 100%;
	padding-right: 0;
	padding-left: 0;
	margin-right: auto;
	margin-left: auto;
	flex-flow: column;
	height: 100vh;
}

.row {
	display: flex;
	flex-wrap: wrap;
	margin-top: calc(#{$gutter-y} * -1);
	margin-right: 0;
	margin-left: 0;
	height: 100%;

	> * {
		width: 100%;
		max-width: 100%;
		padding-right: calc(#{$gutter-x} / 2);
		padding-left: calc(#{$gutter-x} / 2);
		margin-top: $gutter-y;
	}
}

.col {
	flex: 1 0 0%;
	margin-left: 3rem;
	margin-top: 1rem;
}

.fs-1 {
	font-size: variables.$font-size-1;
}
.fs-2 {
	font-size: variables.$font-size-2;
}
.fs-3 {
	font-size: variables.$font-size-3;
}
.fs-4 {
	font-size: variables.$font-size-4;
}
.fs-5 {
	font-size: variables.$font-size-5;
}
.fs-6 {
	font-size: variables.$font-size-6;
}

@media (max-width: 1200px) {
	.fs-1 {
		font-size: calc(1.375rem + 0.667vw) !important;
	}
	.fs-2 {
		font-size: calc(1.325rem + 1.584vw) !important;
	}
	.fs-3 {
		font-size: calc(1.3rem + 0.017vw) !important;
	}
	.fs-4 {
		font-size: calc(0.82rem + 0.4vw) !important;
	}
	.fs-5 {
		font-size: calc(0.65rem + 0.25vw) !important;
	}
}

@media (min-width: 576px) {
	.col {
		margin-left: 4.5rem;
	}
}
</style>