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
	setup(props)
	{
		const commit_patch = [
			h("div", { "class": "commit-file-header" }, [
				h("span", { "class": "fw-bold"}, (props.patch["to"] === "/dev/null") ? props.patch["from"] : props.patch["to"]),
				h("span", (props.patch["to"] === "/dev/null") ? "Deleted" : "" ),
				h("div", { class: "commit-file-add-del" }, [
					h("span", `+${ props.patch["additions"] }`),
					h("span", `-${ props.patch["deletions"] }`)
				])
			])
		];

		if(props.patch["too_large"] === false) {
			let all_hunks = props.patch["hunks"].map((hunk) => hunk["hunk"]);
			
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

			commit_patch.push(h("table", { cellspacing: "0px" }, [
				h("tbody", [
					props.patch["hunks"].map((hunk, hunk_index) =>
					{
						let new_offset = 0;
						let deleted_offset = 0;
						const multiline_comments = [];

						return highlighted_hunks[hunk_index].map((line, line_index) =>
						{
							if(/^@@ -[0-9,]+ \+[0-9,]+ @@/.test(all_hunks[hunk_index][line_index])) {
								new_offset++;
								deleted_offset++;
								return h("tr", { class: "commit-file-pos-change" }, [
									h("td", "..."),
									h("td", "..."),
									h("td", "..."),
									h("td", [
										h("code", all_hunks[hunk_index][line_index])
									])
								]);
							}
							else if(/^\\ No newline at end of file$/.test(all_hunks[hunk_index][line_index])) {
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
							}
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
			]));
		}
		else {
			commit_patch.push(h("div", { class: "ps-3 pt-3 patch-too-large" }, [
				h("span", "Patch is too large to display.")
			]));
		}

		return () => h("div", { class: "commit-file" }, commit_patch);
	}
};
</script>