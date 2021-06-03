<template>
	<BaseBreadcrumb :items="[{ name: 'Tree', path: '/' + repository + '/tree' }]" :active-item="path" />
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
	mounted()
	{
		this.initHighlightedContent();
	},
	setup(props)
	{
		const content_lines = ref([]);

		const initHighlightedContent = async () =>
		{
			const language = hljs_languages.find((lang) => lang["extensions"].some((extension) => path.extname(props.path) === extension));
			let highlighted = language ? hljs.highlight(language["name"], props.content) : hljs.highlightAuto(props.content);
			
			content_lines.value = highlighted.value.split("\n");
		};

		return { content_lines, initHighlightedContent };

		/*
		Console.log(props.content);
		const content_lines = props.content.split("\n");

		const language = hljs_languages.find((lang) => lang["extensions"].some((extension) => path.extname(props.path) === extension));
		let highlighted = language ? hljs.highlight(language["name"], props.content) : hljs.highlightAuto(props.content);
		console.log(highlighted.value);
		Let all_hunks = props.patch["hunks"].map((hunk) => hunk["hunk"]);
		
		const language = hljs_languages.find((lang) => lang["extensions"].some((extension) => props.patch["to"].endsWith(extension)));
		let highlighted = language ? hljs.highlight(language["name"], all_hunks.join("\n")) : hljs.highlightAuto(all_hunks.join("\n"));
		console.log(highlighted);
		highlighted = highlighted["value"].split("\n");

		const highlighted_hunks = [];
		let hunk_start = 0;
		all_hunks.forEach((hunk) =>
		{
			const hunk_row_cnt = hunk.split("\n").length;
			highlighted_hunks.push(highlighted.slice(hunk_start, hunk_start + hunk_row_cnt));
			hunk_start = hunk_start + hunk_row_cnt;
		});

		all_hunks = all_hunks.map((hunk) => hunk.split("\n"));

		return h("table", { cellspacing: "0px" }, [
			h("tbody", [
				Props.patch["hunks"].map((hunk, hunk_index) =>
				{
					const multiline_comments = [];

					return highlighted_hunks[hunk_index].map((line, line_index) =>
					{
						else {
							let first_td;
							let second_td;
							let third_td;

							if(hunk['new'].includes(line_index)) {
								first_td = h("td", "");
								second_td = h("td", { class: "line-highlight-new" }, Number(hunk["new_start"]) + line_index - new_offset);
								third_td = h("td", { class: "line-new" }, "+");
								deleted_offset++;
							}
							else if(hunk['deleted'].includes(line_index)) {
								first_td = h("td", Number(hunk["old_start"]) + line_index - deleted_offset);
								second_td = h("td", { class: "line-highlight-deleted" });
								third_td = h("td", { class: "line-deleted" }, "-");
								new_offset++;
							}
							else {
								first_td = h("td", { class: "line-unchanged" }, Number(hunk["old_start"]) + line_index - deleted_offset);
								second_td = h("td", { class: "line-unchanged" }, Number(hunk["new_start"]) + line_index - new_offset);
								third_td = h("td", "");
							}

							let comment_open = line.match(/<span class="hljs-comment">/g);
							const comment_open_cnt = (comment_open !== null) ? comment_open.length : 0;
							comment_open = (comment_open !== null) ? comment_open[0] : "";

							let comment_close = line.match(/<\/span>/g);
							const comment_close_cnt = (comment_close !== null) ? comment_close.length : 0;
							comment_close = (comment_close !== null) ? comment_close[0] : "";
					
							if(comment_open_cnt > comment_close_cnt) {
								line = line + "</span>";
								console.log("Öppning " + line);
								multiline_comments.push(comment_open);
							}
							else if(comment_open_cnt < comment_close_cnt && multiline_comments.length !== 0) {
								line = multiline_comments[multiline_comments.length - 1] + line;
								console.log("Stängning " + line + "	" + multiline_comments[multiline_comments.length - 1]);
								multiline_comments.pop();
							}
							else if(multiline_comments.length !== 0) {
								line = multiline_comments[multiline_comments.length - 1] + line + "</span>";
								console.log("Mitt i " + line);
							}
					
							return h("tr", [
								first_td,
								second_td,
								third_td,
								h("td", [
									h("code", { innerHTML: line })
								])
							]);
						}
					});
				})
			])
		]);*/
	}
};
</script>