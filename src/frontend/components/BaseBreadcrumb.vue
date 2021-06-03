<template>
	<nav aria-label="breadcrumb">
		<ol class="breadcrumb">
			<li
				v-for="(item, index) in items" class="breadcrumb-item"
				:key="index">
				<router-link :to="item.path">
					{{ item.name }}
				</router-link>
			</li>
			<li class="breadcrumb-item active" aria-current="page">
				{{ activeItem }}
			</li>
		</ol>
	</nav>
</template>


<script>
export default {
	name: "BaseBreadcrumb",
	props: {
		items: {
			type: Array,
			required: true
		},
		activeItem: {
			type: String,
			required: true
		}
	}
};
</script>