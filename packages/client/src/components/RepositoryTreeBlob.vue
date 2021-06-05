<template>
	<table cellspacing="0px">
		<tbody>
			<tr v-for="(line, index) in content_lines" :key="index">
				<td :line="index + 1" />
				<td>
					<code v-html="line" />
				</td>
			</tr>
		</tbody>
	</table>
</template>

<script>
import { ref } from "vue";
import hljs from "highlight.js";
import hljs_languages from "../util/hljs-languages";
import path from "path";

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
	},
	watch: {
		content() {
			this.initHighlightedContent();
		}
	},
	mounted() {
		this.initHighlightedContent();
	},
	setup(props) {
		const content_lines = ref([]);

		const initHighlightedContent = async() => {
			const language = hljs_languages.find((lang) => lang.extensions.some((extension) => path.extname(props.path) === extension));
			const highlighted = language ? hljs.highlight(props.content, { language: language.name }) : hljs.highlightAuto(props.content);

			content_lines.value = highlighted.value.split("\n");
		};

		return { content_lines, initHighlightedContent };
	}
};
</script>

<style lang="scss">
@import "~highlight.js/scss/srcery.scss";

code {
	white-space: pre-wrap;
	word-wrap: anywhere;
}

[line]::before {
	content: attr(line);
	padding-right: 10px;
}
</style>
