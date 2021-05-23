<template>
	<div id="navbar" class="row mx-0">
		<div id="repo-navbar" class="col ms-4 ps-4">
			<nav class="navbar navbar-expand navbar-dark">
				<div class="container-fluid px-0">
					<div class="collapse navbar-collapse">
						<ul class="navbar-nav">
							<li v-for="(item, index) in nav_items" v-bind:key="index" class="nav-item">
								<a class="nav-link fs-4" :class="{ active: activePage === item }" :aria-current="(activePage === item) ? 'page' : ''" :href="item">{{ item }}</a>
							</li>
						</ul>
					</div>
				</div>
			</nav>
		</div>
	</div>
</template>

<script>
export default {
	name: "RepositoryNavbar",
	props: {
		activePage: String
	},
	data()
	{
		return {
			nav_items: ["log", "refs", "tree"]
		};
	}
}
</script>