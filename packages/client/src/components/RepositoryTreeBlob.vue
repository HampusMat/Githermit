<template>
	<table cellspacing="0px" v-if="!is_markdown">
		<tbody>
			<tr v-for="(line, index) in content_lines" :key="index">
				<td :line="index + 1" />
				<td>
					<code v-html="line" />
				</td>
			</tr>
		</tbody>
	</table>
	<span
		v-else v-html="content_blob"
		id="markdown-blob" />
</template>

<script lang="ts">
import { defineComponent, Ref, ref } from "vue";
import hljs from "highlight.js";
import hljs_languages from "../util/hljs-languages";
import marked from "marked";

export default defineComponent({
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
		const content_lines: Ref<string[]> = ref([]);
		const content_blob: Ref<string> = ref("");
		const is_markdown: Ref<boolean> = ref(false);

		async function initHighlightedContent() {
			const path_extension = /(?:\.([^.]+))?$/;

			const path_ext = path_extension.exec(props.path);
			let ext = "";

			if(path_ext) {
				ext = `.${path_ext[1]}`;
			}

			if(ext === ".md") {
				const markdown = document.createElement("html");
				markdown.innerHTML = marked(props.content);

				const checkboxes = markdown.querySelectorAll("ul > li > input[type=\"checkbox\"]");
				checkboxes.forEach(checkbox => {
					if(checkbox.parentElement) {
						checkbox.parentElement.classList.add("checkbox-list");
					}
				});

				const codeblocks = markdown.querySelectorAll("code");
				codeblocks.forEach(codeblock => {
					codeblock.classList.add("markdown-codeblock");
				});

				content_blob.value = markdown.innerHTML;
				is_markdown.value = true;
				return;
			}

			const language = hljs_languages.find(lang => lang.extensions.some(extension => ext === extension));
			const highlighted = language ? hljs.highlight(props.content, { language: language.name }) : hljs.highlightAuto(props.content);

			content_lines.value = highlighted.value.split("\n");
		};

		return { content_lines, content_blob, is_markdown, initHighlightedContent };
	}
});
</script>

<style lang="scss">
@use "../scss/colors";
@use "../scss/fonts";

@import "~highlight.js/scss/srcery.scss";

ul {
	padding-left: 30px;
}

.checkbox-list {
	list-style-type: none;
	padding-left: 5px;
}

code {
	display: inline-block;
	white-space: pre-wrap;
	word-wrap: anywhere;
	background-color: lighten(#000000, 8%);
	font-family: fonts.$primary;
}

#markdown-blob {
	word-wrap: anywhere;
	a {
		color: colors.$primary-light;
		&:hover {
			text-decoration: underline;
		}
	}
}

.markdown-codeblock {
	padding-right: 10px;
	padding-left: 5px;
	padding-top: 2px;
	padding-bottom: 5px;
}

p {
	max-width: 95ch;
}

</style>

<style lang="scss" scoped>
table {
	table-layout: fixed;
	background-color: lighten(#000000, 8%);
	padding-top: 5px;
	padding-bottom: 5px;
	width: 98%;
}

td:nth-child(1) {
	width: max-content;
	padding-right: 20px;
	font-weight: 300;
}

[line]::before {
	content: attr(line);
}
</style>