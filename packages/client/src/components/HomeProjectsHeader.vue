<template>
	<div class="row mx-0">
		<div id="projects-header" class="col ms-4">
			<span class="fs-1">
				Projects
			</span>
		</div>
		<div id="projects-search" class="col d-flex justify-content-end">
			<form>
				<input type="search" name="q">
				<input
					type="submit" value="Search"
					class="btn btn-primary">
			</form>
		</div>
	</div>
</template>

<script>
export default {
	name: "HomeProjectsHeader"
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "../scss/bootstrap";

@import "~bootstrap/scss/buttons";

#projects-search {
	align-items: center;
	form {
		display: flex;
		align-items: center;
		height: 35px;
		input[type=search] {
			margin-right: 15px;
		}
	}
	input[type=submit] {
		margin-right: 15px;
	}
}
</style>
