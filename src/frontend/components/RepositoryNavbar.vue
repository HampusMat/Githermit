<template>
	<div id="navbar" class="row mx-0">
		<div id="repo-navbar" class="col ms-4 ps-4">
			<nav class="navbar navbar-expand navbar-dark">
				<div class="container-fluid px-0">
					<div class="collapse navbar-collapse">
						<ul class="navbar-nav align-items-center flex-fill">
							<li
								v-for="(item, index) in nav_items" :key="index"
								class="nav-item">
								<a
									class="nav-link fs-4" :class="{ active: activePage === item }"
									:aria-current="(activePage === item) ? 'page' : ''" :href="item">{{ item }}</a>
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
import RepositoryCloneDropdown from "./RepositoryCloneDropdown";

export default {
	name: "RepositoryNavbar",
	props: {
		activePage: {
			type: String,
			required: true
		},
		repository: {
			type: String,
			required: true
		}
	},
	components: {
		RepositoryCloneDropdown
	},
	data()
	{
		return {
			nav_items: [ "log", "refs", "tree" ],
			url: `${window.location.protocol}//${window.location.host}/${this.repository}`
		};
	}
}
</script>