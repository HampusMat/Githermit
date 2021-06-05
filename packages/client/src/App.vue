<template>
	<router-view />
</template>

<style lang="scss">
@use "./scss/colors";

@import "./scss/bootstrap";

@import "~bootstrap/scss/utilities";
@import "~bootstrap/scss/utilities/api";
@import "~bootstrap/scss/containers";
@import "~bootstrap/scss/grid";
@import "~bootstrap/scss/tooltip";

@import "./scss/fonts";

#app {
	font-family: $font-primary;
	color: colors.$text;
	min-height: 100vh;
	background-color: colors.$background;
}

a {
	color: colors.$text;
	text-decoration: none;
	&:hover {
		color: colors.$primary-light;
	}
}
</style>
