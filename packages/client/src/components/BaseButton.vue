<template>
	<button :type="type ? type : ''">
		{{ value }}
	</button>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
	name: "BaseButton",
	props: {
		type: {
			type: String,
			required: true
		},
		value: {
			type: String,
			required: true
		}
	}
});
</script>

<style lang="scss" scoped>
@use "../scss/mixins";

button {
	@include mixins.button;
}
</style>