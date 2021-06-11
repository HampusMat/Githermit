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

<style lang="scss" scoped>
@use "../scss/colors";

.breadcrumb {
	display: flex;
	flex-wrap: wrap;
	padding: 0 0;
	margin-bottom: 1rem;
	list-style: none;
	a {
		color: colors.$text;
		text-decoration: none;
	}
	.active {
		color: #6c757d;
	}
	.breadcrumb-item {
		padding-left: 0.5rem;
		+ .breadcrumb-item::before {
			float: left;
			padding-right: 0.5rem;
			color: #6c757d;
			content: "/";
		}
	}
}
</style>
