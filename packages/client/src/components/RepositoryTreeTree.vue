<template>
	<table id="tree" class="fs-5">
		<thead>
			<tr>
				<th>Name</th>
				<th>Last commit</th>
				<th>Last updated</th>
			</tr>
		</thead>
		<tbody>
			<tr v-if="path !== ''" @click="$router.push(`/${repository}/tree/${path.split('/').slice(0, -1).join('/') }`)">
				<td
					class="d-flex align-items-center">
					<div class="tree-entry-padding" />
					..
				</td>
				<td />
				<td />
			</tr>
			<tr
				v-for="(entry, entry_name, index) in tree" :key="index"
				@click="$router.push(`/${repository}/tree${path ? '/' + path : ''}/${entry_name}`)">
				<td class="d-flex align-items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg" height="18px"
						viewBox="0 0 24 24" width="18px"
						fill="#FFFFFF" v-if="entry['type'] === 'tree'"
						preserveAspectRatio="xMidYMin">
						<path d="M0 0h24v24H0z" fill="none" />
						<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
					</svg>
					<span v-else class="tree-entry-padding" />
					<a @click="stopClick" :href="`/${repository}/tree${path ? '/' + path : ''}/${entry_name}`">{{ entry_name }}</a>
				</td>
				<td>
					<a @click="routeToCommit(entry.last_commit.id, $event)" :href="`/${repository}/log/${entry.last_commit.id}`">
						{{ entry.last_commit.message }}
					</a>
				</td>
				<td>
					{{ getPrettyLastUpdated(entry.last_commit.time) }}
				</td>
			</tr>
		</tbody>
	</table>
</template>

<script>
const { formatDistance } = require("date-fns");

export default {
	name: "RepositoryTreeTree",
	props: {
		repository: {
			type: String,
			required: true
		},
		path: {
			type: String,
			required: true
		},
		tree: {
			type: Object,
			required: true
		}
	},
	methods: {
		stopClick(event) {
			event.preventDefault();
		},
		routeToCommit(commit_id, event) {
			event.stopPropagation();
			event.preventDefault();
			this.$router.push(`/${this.repository}/log/${commit_id}`);
		},
		getPrettyLastUpdated(date) {
			return formatDistance(new Date(), new Date(date));
		}
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";
@import "../scss/bootstrap";

#tree {
	border-spacing: 0;
	th {
		padding-bottom: 5px;
		color: colors.$secondary;
		text-align: start;
		padding-right: 20px;
	}
	tbody tr:hover {
		background-color: lighten(colors.$background, 10%);
	}
	td {
		padding-top: 5px;
		padding-bottom: 5px;
		padding-right: 2vw;
		&:nth-child(2) a, &:nth-child(3) {
			font-weight: 300;
		}
	}
	.tree-entry-padding, svg {
		width: 18px;
		padding-right: 5px;
	}
	a {
		padding-right: 18px;
	}
}
</style>
