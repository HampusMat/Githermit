<template>
	<div id="clone" class="d-flex align-items-center">
		<div class="dropdown">
			<button
				class="btn btn-primary btn-sm dropdown-toggle" type="button"
				id="dropdownMenuButton1" data-bs-toggle="dropdown"
				data-bs-auto-close="outside" aria-expanded="false">
				Clone
			</button>
			<ul class="dropdown-menu dropdown-menu-end dropdown-menu-dark" aria-labelledby="dropdownMenuButton1">
				<li class="pt-2">
					<span class="ms-2 fs-5 fw-bold">Clone with HTTP</span>
					<label id="clone-url-copy">
						<input
							type="text" :value="getURL()"
							class="form-control form-control-sm ms-2 me-2" readonly>
						<svg
							xmlns="http://www.w3.org/2000/svg" height="18px"
							viewBox="0 0 24 24" width="18px"
							fill="#FFFFFF" @click="copyToClipboard">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
						</svg>
					</label>
				</li>
			</ul>
		</div>
	</div>
</template>

<script>
import { Tooltip } from "bootstrap/dist/js/bootstrap.esm";
// Import Fan from "../util/sleep.worker";

export default {
	name: "RepositoryCloneDropdown",
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	methods: {
		async copyToClipboard(event) {
			const url_box = document.getElementById("clone").getElementsByTagName("input")[0];

			url_box.select();
			url_box.setSelectionRange(0, 99999);
			document.execCommand("copy");

			event.stopPropagation();

			const exampleEl = document.getElementById("clone-url-copy").getElementsByTagName("svg")[0];
			const tooltip = new Tooltip(exampleEl, { title: "Copied the URL", trigger: "manual" });
			console.log(tooltip);
			tooltip.show();

			await new Promise(resolve => setTimeout(resolve, 1700));
			tooltip.hide();
		},
		getURL() {
			return `${window.location.protocol}//${window.location.host}/${this.repository}`;
		}
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "../scss/bootstrap";

$dropdown-dark-bg: lighten(#000000, 10%);

@import "~bootstrap/scss/buttons";
@import "~bootstrap/scss/dropdown";
@import "~bootstrap/scss/forms";
@import "~bootstrap/scss/tooltip";

.form-control {
	width: auto;
}

#clone {
	margin-left: auto;
	margin-right: 40px;
}

#clone-url-copy {
	position: relative;
	height: 30px;
	display: block;
    text-align: left;
    margin: 10px auto;
	input {
		display: inline-block;
		padding-right: 30px;
		min-height: 0;
	}
	svg {
		content: "";
		position: absolute;
		right: 12px;
		top: 7px;
		bottom: 0;
		width: 18px;
		fill: colors.$not-selected;
		&:hover {
			fill: colors.$text;
		}
	}
}
</style>
