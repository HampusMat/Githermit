<template>
	<div>
		<router-link :to="to">
			<svg
				xmlns="http://www.w3.org/2000/svg" id="back"
				height="24px" width="24px"
				viewBox="0 0 24 24" fill="#ffffff">
				<path d="M0 0h24v24H0z" fill="none" />
				<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
			</svg>
		</router-link>
	</div>
</template>

<script>
export default {
	name: "BaseBackButton",
	props: {
		to: {
			type: String,
			required: true
		}
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";

#back:hover {
	fill: colors.$primary-light;
}
</style>
