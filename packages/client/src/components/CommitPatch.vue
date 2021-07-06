<script lang="ts">
import { defineComponent, h, PropType, VNode } from "vue";
import hljs from "highlight.js";
import hljs_languages from "../util/hljs-languages";

type Hunk = {
	new_start: number,
	new_lines_cnt: number,
	new_lines: number[],
	old_start: number,
	old_lines_cnt: number,
	deleted_lines: number[],
	hunk: string
}

type Patch = {
	additions: number,
	deletions: number,
	from: string,
	to: string,
	too_large: boolean,
	hunks: Hunk[]
}

export default defineComponent({
	name: "CommitPatch",
	props: {
		patch: {
			type: Object as PropType<Patch>,
			required: true
		}
	},
	setup(props) {
		if(props.patch.too_large === true) {
			return () => h("div", { class: "ps-3 pt-3 patch-too-large" }, [
				h("span", "Patch is too large to display.")
			]);
		}

		// Array of hunks without the first chunk headers
		const all_hunks = props.patch.hunks.map((hunk) => hunk.hunk.split("\n").slice(1).join("\n"));

		// Check if the patch's file extension matches any predefined language.
		const language = hljs_languages.find((lang) => lang.extensions.some((extension) => props.patch.to.endsWith(extension)));

		// Syntax highlight all of the patch's hunks
		const highlight_result = language
			? hljs.highlight(all_hunks.join("\n"), { language: language.name })
			: hljs.highlightAuto(all_hunks.join("\n"));

		const highlighted = highlight_result.value.split("\n");

		const highlighted_hunks: string[][] = [];

		let hunk_start = 0;
		all_hunks.forEach((hunk, index) => {
			// Add the chunk headers back to the hunks
			all_hunks[index] = props.patch.hunks[index].hunk.split("\n")[0] + all_hunks[index];

			// Split the syntax highlighted patch back into hunks
			const hunk_row_cnt = hunk.split("\n").length;
			highlighted_hunks.push(highlighted.slice(hunk_start, hunk_start + hunk_row_cnt));

			hunk_start = hunk_start + hunk_row_cnt;
		});

		const all_hunks_raw = all_hunks.map((hunk) => hunk.split("\n"));

		return () => h("table", { cellspacing: "0px" }, [
			h("tbody", [
				props.patch.hunks.map((hunk, hunk_index) => {
					let new_offset = 0;
					let deleted_offset = 0;
					const multiline_comments: string[] = [];

					return highlighted_hunks[hunk_index].map((line, line_index) => {
						if(/^@@ -[0-9,]+ \+[0-9,]+ @@/.test(all_hunks_raw[hunk_index][line_index])) {
							return h("tr", { class: "commit-file-pos-change" }, [
								h("td", { "patch-line-col-unsel": "..." }),
								h("td", { "patch-line-col-unsel": "..." }),
								h("td", { "patch-line-col-unsel": "..." }),
								h("td", [
									h("code", all_hunks_raw[hunk_index][line_index])
								])
							]);
						} else if(/^\\ No newline at end of file$/.test(all_hunks_raw[hunk_index][line_index])) {
							new_offset++;
							deleted_offset++;
							return h("tr", { class: "commit-file-no-newline" }, [
								h("td", ""),
								h("td", ""),
								h("td", ""),
								h("td", [
									h("code", all_hunks_raw[hunk_index][line_index])
								])
							]);
						} else {
							let first_td: VNode;
							let second_td: VNode;
							let third_td: VNode;

							const adjusted_line_index = line_index + 1;

							if(hunk.new_lines.includes(adjusted_line_index)) {
								first_td = h("td", "");
								second_td = h("td", { class: "line-highlight-new", "patch-line-col-unsel": Number(hunk.new_start) + line_index - new_offset });
								third_td = h("td", { class: "line-new", "patch-line-col-unsel": "+" });
								deleted_offset++;
							} else if(hunk.deleted_lines.includes(adjusted_line_index)) {
								first_td = h("td", { "patch-line-col-unsel": Number(hunk.old_start) + line_index - deleted_offset });
								second_td = h("td", { class: "line-highlight-deleted" });
								third_td = h("td", { class: "line-deleted", "patch-line-col-unsel": "-" });
								new_offset++;
							} else {
								first_td = h("td", { class: "line-unchanged", "patch-line-col-unsel": Number(hunk.old_start) + line_index - deleted_offset });
								second_td = h("td", { class: "line-unchanged", "patch-line-col-unsel": Number(hunk.new_start) + line_index - new_offset });
								third_td = h("td", "");
							}

							const is_comment_open = line.match(/<span class="hljs-comment">/g);
							const comment_open_cnt = (is_comment_open !== null) ? is_comment_open.length : 0;
							const comment_open = (is_comment_open !== null) ? is_comment_open[0] : "";

							const is_comment_close = line.match(/<\/span>/g);
							const comment_close_cnt = (is_comment_close !== null) ? is_comment_close.length : 0;
							// Const comment_close = (is_comment_close !== null) ? is_comment_close[0] : "";

							if(comment_open_cnt > comment_close_cnt) {
								line = line + "</span>";
								multiline_comments.push(comment_open);
							} else if(comment_open_cnt < comment_close_cnt && multiline_comments.length !== 0) {
								line = multiline_comments[multiline_comments.length - 1] + line;
								multiline_comments.pop();
							} else if(multiline_comments.length !== 0) {
								line = multiline_comments[multiline_comments.length - 1] + line + "</span>";
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
		]);
	}
});
</script>
