<template>
	<div id="projects">
		<div id="projects-header">
			<span class="fs-1">
				Projects
			</span>
		</div>
		<div id="projects-search">
			<form>
				<input type="search" name="q">
				<BaseButton type="submit" value="Search" />
			</form>
		</div>
	</div>
</template>

<script>
import BaseButton from "@/components/BaseButton";

export default {
	name: "HomeProjectsHeader",
	components: {
		BaseButton
	}
};
</script>

<style lang="scss" scoped>
#projects {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
}

#projects-search {
	display: flex;
	align-items: center;
	margin-left: auto;
	margin-right: 15px;
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
