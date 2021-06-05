<template>
	<div id="navbar">
		<div id="repo-navbar" class="ms-4 ps-4">
			<nav class="navbar navbar-expand navbar-dark">
				<div class="container-fluid px-0">
					<div class="collapse navbar-collapse">
						<ul class="navbar-nav align-items-center flex-fill">
							<li
								v-for="(item, index) in ['log', 'refs', 'tree']" :key="index"
								class="nav-item">
								<router-link
									class="nav-link fs-4" :class="{ active: activePage === item }"
									:aria-current="(activePage === item) ? 'page' : ''" :to="'/' + repository + '/' + item">
									{{ item }}
								</router-link>
							</li>
							<li class="nav-item ms-auto me-4">
								<RepositoryCloneDropdown :repository="repository" class="d-block" />
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</div>
	</div>
</template>

<script>
import RepositoryCloneDropdown from "@/components/RepositoryCloneDropdown";

export default {
	name: "RepositoryNavbar",
	props: {
		repository: {
			type: String,
			required: true
		},
		activePage: {
			type: String,
			required: true
		}
	},
	components: {
		RepositoryCloneDropdown
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "../scss/bootstrap";

@import "~bootstrap/scss/nav";
@import "~bootstrap/scss/navbar";

#navbar {
	line-height: 0;
}
</style>
