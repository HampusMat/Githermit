<script>
import { h } from "vue";
import hljs from "highlight.js";
import hljs_languages from "../util/hljs-languages";

export default {
	name: "CommitPatch",
	props: {
		patch: {
			type: Object,
			required: true
		}
	},
	setup(props) {
		let commit_patch;

		if(props.patch.too_large === false) {
			let all_hunks = props.patch.hunks.map((hunk) => hunk.hunk.split("\n").slice(1).join("\n"));

			const language = hljs_languages.find((lang) => lang.extensions.some((extension) => props.patch.to.endsWith(extension)));
			let highlighted = language ? hljs.highlight(all_hunks.join("\n"), { language: language.name }) : hljs.highlightAuto(all_hunks.join("\n"));
			highlighted = highlighted.value.split("\n");

			const highlighted_hunks = [];
			let hunk_start = 0;
			all_hunks.forEach((hunk, index) => {
				const hunk_row_cnt = hunk.split("\n").length;
				all_hunks[index] = props.patch.hunks[index].hunk.split("\n")[0] + all_hunks[index];
				highlighted_hunks.push(highlighted.slice(hunk_start, hunk_start + hunk_row_cnt));
				hunk_start = hunk_start + hunk_row_cnt;
			});

			all_hunks = all_hunks.map((hunk) => hunk.split("\n"));

			commit_patch = h("table", { cellspacing: "0px" }, [
				h("tbody", [
					props.patch.hunks.map((hunk, hunk_index) => {
						let new_offset = 0;
						let deleted_offset = 0;
						const multiline_comments = [];

						return highlighted_hunks[hunk_index].map((line, line_index) => {
							if(/^@@ -[0-9,]+ \+[0-9,]+ @@/.test(all_hunks[hunk_index][line_index])) {
								new_offset++;
								deleted_offset++;
								return h("tr", { class: "commit-file-pos-change" }, [
									h("td", { "patch-line-col-unsel": "..." }),
									h("td", { "patch-line-col-unsel": "..." }),
									h("td", { "patch-line-col-unsel": "..." }),
									h("td", [
										h("code", all_hunks[hunk_index][line_index])
									])
								]);
							} else if(/^\\ No newline at end of file$/.test(all_hunks[hunk_index][line_index])) {
								new_offset++;
								deleted_offset++;
								return h("tr", { class: "commit-file-no-newline" }, [
									h("td", ""),
									h("td", ""),
									h("td", ""),
									h("td", [
										h("code", all_hunks[hunk_index][line_index])
									])
								]);
							} else {
								let first_td;
								let second_td;
								let third_td;

								if(hunk.new_lines.includes(line_index)) {
									first_td = h("td", "");
									second_td = h("td", { class: "line-highlight-new", "patch-line-col-unsel": Number(hunk.new_start) + line_index - new_offset });
									third_td = h("td", { class: "line-new", "patch-line-col-unsel": "+" });
									deleted_offset++;
								} else if(hunk.deleted_lines.includes(line_index)) {
									first_td = h("td", { "patch-line-col-unsel": Number(hunk.old_start) + line_index - deleted_offset });
									second_td = h("td", { class: "line-highlight-deleted" });
									third_td = h("td", { class: "line-deleted", "patch-line-col-unsel": "-" });
									new_offset++;
								} else {
									first_td = h("td", { class: "line-unchanged", "patch-line-col-unsel": Number(hunk.old_start) + line_index - deleted_offset });
									second_td = h("td", { class: "line-unchanged", "patch-line-col-unsel": Number(hunk.new_start) + line_index - new_offset });
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
								} else if(comment_open_cnt < comment_close_cnt && multiline_comments.length !== 0) {
									line = multiline_comments[multiline_comments.length - 1] + line;
									console.log("Stängning " + line + "	" + multiline_comments[multiline_comments.length - 1]);
									multiline_comments.pop();
								} else if(multiline_comments.length !== 0) {
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
			]);
		} else {
			commit_patch = h("div", { class: "ps-3 pt-3 patch-too-large" }, [
				h("span", "Patch is too large to display.")
			]);
		}

		return () => commit_patch;
	}
};
</script>
