<template>
	<div id="navbar">
		<nav class="navbar">
			<div class="navbar-container">
				<div class="nav">
					<ul>
						<li
							v-for="(item, index) in nav_items" :key="index">
							<router-link
								class="nav-link fs-4" :class="{ active: activePage === item }"
								:aria-current="(activePage === item) ? 'page' : ''" :to="'/' + repository + '/' + item">
								{{ item }}
							</router-link>
						</li>
						<li id="clone-dropdown">
							<RepositoryCloneDropdown :repository="repository" class="d-block" />
						</li>
					</ul>
				</div>
			</div>
		</nav>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import RepositoryCloneDropdown from "../components/RepositoryCloneDropdown.vue";

export default defineComponent({
	name: "RepositoryNavbar",
	props: {
		repository: {
			type: String,
			required: true
		},
		activePage: {
			type: String,
			required: false,
			default: null
		},
		hasReadme: {
			type: Boolean,
			required: true
		}
	},
	components: {
		RepositoryCloneDropdown
	},
	data() {
		return {
			nav_items: [ "log", "refs", "tree" ]
		};
	},
	watch: {
		hasReadme() {
			this.nav_items = [ "about" ].concat(this.nav_items);
		}
	}
});
</script>

<style lang="scss" scoped>
@use "../scss/colors";

#navbar {
	margin-left: 3rem;
}

.navbar {
	position: relative;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	justify-content: space-between;
	padding-top: 0.5rem;
	padding-bottom: 0.5rem;
	flex-wrap: nowrap;
    justify-content: flex-start;
	.navbar-container {
		display: flex;
		flex-wrap: inherit;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		.nav {
			display: flex;
			flex-basis: auto;
			flex-grow: 1;
			align-items: center;
			ul {
				display: flex;
				flex-direction: row;
				padding-left: 0;
				margin-bottom: 0;
				list-style: none;
				align-items: center;
				flex: 1 1 auto;
				.nav-link {
					color: darken(#ffffff, 50%);
					padding-right: 0.5rem;
					padding-left: 0.5rem;
					transition: color .15s ease-in-out;
					&:hover {
						color: darken(#ffffff, 20%);
					}
				}
				#clone-dropdown {
					margin-left: auto;
					margin-right: 40px;
				}
				.active {
					color: darken(#ffffff, 20%);
				}
			}
		}
	}
}

</style>
