const { formatDistance } = require('date-fns');
			resolve(formatDistance(new Date(), new Date(Number(Buffer.concat(commit).toString()) * 1000)));
function parseCommitFilePart(part)
{
	let new_lines = [];
	let deleted_lines = [];
	let old_from;
	let old_to;
	let from;
	let to;

	if(/^@@\ -[0-9,]+\ \+[0-9,]+\ @@/.test(part[0])) {
		const from_to = /^@@\ (-[0-9,]+)\ (\+[0-9,]+)\ @@(?:\ (.*))?/.exec(part[0]);

		old_from = Number(from_to[1].split(',')[0].slice(1));
		old_to = Number(from_to[1].split(',')[1]);

		from = Number(from_to[2].split(',')[0].slice(1));
		to = Number(from_to[2].split(',')[1]);

		if(old_from === 1 || from === 1) {
			part = part.slice(1);
		}
	}
	else {
		old_from = 1;
		old_to = part.length - new_lines.length;

		from = 1;
		to = part.length - deleted_lines.length;
	}

	part.forEach((line, index) =>
	{
		if(line.charAt(0) === '+') {
			line = line.slice(1);
			new_lines.push(index);
		}
		else if(line.charAt(0) === '-') {
			line = line.slice(1);
			deleted_lines.push(index);
		}
		else {
			["+", "-"].forEach((char) =>
			{
				const find_char = new RegExp(`(?<=^<span.*>)\\${char}(?=.*<\/span>)`);
				if(find_char.test(line)) {
					console.log(`${char} ${line}`);
					const char_index = find_char.exec(line)["index"];
					line = line.slice(0, char_index) + line.slice(char_index + 1)
					if(char === "+") {
						new_lines.push(index);
					}
					else if(char === "-") {
						deleted_lines.push(index);
					}
				}
			})
		}
		part[index] = line;
	});

	return { "new_lines": new_lines, "deleted_lines": deleted_lines, "old_from": old_from, "old_to": old_to, "from": from, "to": to, "part": part.join("\n") };
}

					if(start != undefined) {
						let file_diff = diff.slice(start, index);
						let header;
						
						console.log(file_diff.join("\n"));
							const from_to = file_diff.slice(chunk_header_index - 2, chunk_header_index);
							file_info["from"] = from_to[0].slice(4);
							file_info["to"] = from_to[1].slice(4);

							let raw_diff = file_diff.slice(chunk_header_index);
							let parsed_diff = [];

							let last_diff_start = 0;
							raw_diff.forEach((diff_line, diff_index) =>
							{
								console.log(raw_diff.length + " " + diff_index + " " + diff_line);
								if(/^@@\ -[0-9,]+\ \+[0-9,]+\ @@/.test(diff_line) && diff_index !== 0) {
									let part = parseCommitFilePart(raw_diff.slice(last_diff_start, diff_index));
									parsed_diff.push(part);
									last_diff_start = diff_index;
								}
								else if(diff_index === raw_diff.length - 1) {
									let part = parseCommitFilePart(raw_diff.slice(last_diff_start, diff_index + 1));
									parsed_diff.push(part);
								}
							});

							console.log(raw_diff);
							file_info["diff"] = parsed_diff;


							header = file_diff.slice(1, chunk_header_index - 2);
						}
						else {
							const from_to = /^diff\ --git (a\/[^\ ]+)\ (b\/[^\ ]+)$/.exec(file_diff[0]);
							file_info["from"] = from_to[1];
							file_info["to"] = from_to[2];
							header = file_diff.slice(1, chunk_header_index);
						}
						
								const data = /^index\ ([0-9a-f,]+)\.\.([0-9a-f,]+)(?:\ ([0-9,]+))?$/.exec(line).slice(1);