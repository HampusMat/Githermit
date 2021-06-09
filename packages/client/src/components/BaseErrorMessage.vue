<template>
	<div v-if="fetchFailed" class="fs-5">
		<span class="fetch-error-title">Error</span>
		<p>{{ fetchFailed }}</p>
	</div>
</template>

<script>
export default {
	name: "BaseErrorMessage",
	props: {
		fetchFailed: {
			type: String,
			required: true
		}
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";

.fetch-error-title {
	color: colors.$danger;
	font-weight: 700;
}
</style>
