<template>
	{{ content }}
</template>

<script>
export default {
	name: "RepositoryTreeBlob",
	props: {
		repository: {
			type: String,
			required: true
		},
		path: {
			type: String,
			required: true
		},
		content: {
			type: String,
			required: true
		}
	}
};
</script>