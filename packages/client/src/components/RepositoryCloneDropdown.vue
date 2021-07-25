<template>
	<div id="clone">
		<button
			id="dropdown-button" aria-describedby="dropdown-menu"
			type="button">
			Clone
		</button>
		<div id="dropdown-menu" role="dropdown-menu">
			<div>
				<p id="dropdown-title" class="fs-5">
					Clone with HTTP
				</p>
				<div
					id="copied-tooltip" role="copied-tooltip"
					class="fs-5">
					<div id="tooltip-arrow" />
					Copied!
				</div>
				<label id="clone-url-copy">
					<input
						type="text" :value="getURL()"
						readonly>
					<svg
						xmlns="http://www.w3.org/2000/svg" height="18px"
						viewBox="0 0 24 24" width="18px"
						fill="#FFFFFF" @click="copyToClipboard"
						id="copy">
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
					</svg>
				</label>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { createPopper } from "@popperjs/core";

export default defineComponent({
	name: "RepositoryCloneDropdown",
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	methods: {
		async copyToClipboard(event: Event) {
			const url_box = document.getElementById("clone")?.getElementsByTagName("input")[0];

			if(!url_box) {
				return;
			}

			url_box.select();
			url_box.setSelectionRange(0, 99999);
			document.execCommand("copy");

			const copied_tooltip = document.querySelector("#copied-tooltip");

			if(copied_tooltip) {
				copied_tooltip.classList.add("show");

				await new Promise(resolve => setTimeout(resolve, 2000));
				copied_tooltip.classList.remove("show");
			}
		},
		getURL() {
			return `${window.location.protocol}//${window.location.host}/${this.repository}`;
		}
	},
	mounted() {
		const dropdown_button = document.querySelector("#dropdown-button");
		const dropdown_menu = document.getElementById("dropdown-menu");

		const copied_tooltip = document.getElementById("copied-tooltip");
		const copy = document.querySelector("#copy");
		const tooltip_arrow = document.querySelector("#tooltip-arrow");

		if(dropdown_button && dropdown_menu) {
			createPopper(dropdown_button, dropdown_menu, {
				placement: "bottom-end",
				modifiers: [
					{
						name: "offset",
						options: { offset: [ 0, 2 ] }
					}
				]
			});
		}

		if(copy && copied_tooltip) {
			createPopper(copy, copied_tooltip, {
				placement: "top",
				modifiers: [
					{
						name: "offset",
						options: { offset: [ 0, 10 ] }
					},
					{
						name: "arrow",
						options: { element: tooltip_arrow }
					}
				]
			});
		}

		function clickOutsideDropdown(event: Event) {
			const target = event.target as HTMLElement;

			if(dropdown_menu && dropdown_menu.contains(target) === false && target !== dropdown_button) {
				dropdown_menu.classList.remove("show");
				document.removeEventListener("click", clickOutsideDropdown);
			}
		};

		if(dropdown_button) {
			dropdown_button.addEventListener("click", () => {
				if(dropdown_menu) {
					if(dropdown_menu.classList.contains("show")) {
						dropdown_menu.classList.remove("show");
						document.removeEventListener("click", clickOutsideDropdown);
					}
					else {
						dropdown_menu.classList.add("show");
						document.addEventListener("click", clickOutsideDropdown);
					}
				}
			});
		}
	}
});
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@use "../scss/mixins";
@use "../scss/fonts";

#clone {
	display: flex;
	align-items: center;
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
		background: lighten(#000000, 15%);
		border: 1px solid lighten(#000000, 28%);
		color: colors.$text;
		border-radius: 2px;
		height: 25px;
		margin-left: 0.5rem;
		margin-right: 0.5rem;
		font-family: fonts.$primary;
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

#dropdown-button {
	@include mixins.button;
	padding: 3px 5px 3px 6px;
	font-size: 15px;
	font-family: fonts.$primary;
	&::after {
		display: inline-block;
		vertical-align: 0.255em;
		content: "";
		border-top: 0.3em solid;
		border-right: 0.3em solid transparent;
		border-bottom: 0;
		border-left: 0.3em solid transparent;
	}
}

#dropdown-menu {
	visibility: hidden;
	pointer-events: none;
	background-color: lighten(#000000, 12%);
	opacity: 0;
	transition:visibility 0.08s linear,opacity 0.08s linear;
	border-radius: 5px;
	z-index: 1000;
	position: absolute;
}

#copied-tooltip {
	visibility: hidden;
	pointer-events: none;
	position: absolute;
	background-color: #000000;
	padding-left: 10px;
	padding-right: 10px;
	padding-top: 2px;
	padding-bottom: 2px;
	border-radius: 3px;
	z-index: 99999;
	opacity: 0;
	transition:visibility 0.4s linear,opacity 0.4s linear;
}

.show {
	visibility: visible !important;
	pointer-events: all !important;
	opacity: 1 !important;
}

#tooltip-arrow {
	bottom: -4px;
}

#tooltip-arrow,
#tooltip-arrow::before {
  position: absolute;
  width: 8px;
  height: 8px;
  z-index: -1;
}

#tooltip-arrow::before {
  content: '';
  transform: rotate(45deg);
  background: #000000;
}

#dropdown-title {
	margin-left: 0.5rem;
	font-weight: 700;
}
</style>