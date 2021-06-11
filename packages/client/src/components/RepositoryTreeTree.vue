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
					class="flex-center">
					<div class="tree-entry-padding" />
					..
				</td>
				<td />
				<td />
			</tr>
			<tr
				v-for="(entry, index) in tree" :key="index"
				@click="$router.push(`/${repository}/tree${path ? '/' + path : ''}/${entry.name}`)">
				<td>
					<div class="flex-center">
						<svg
							xmlns="http://www.w3.org/2000/svg" height="18px"
							viewBox="0 0 24 24" width="18px"
							fill="#FFFFFF" v-if="entry['type'] === 'tree'"
							preserveAspectRatio="xMidYMin">
							<path d="M0 0h24v24H0z" fill="none" />
							<path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
						</svg>
						<span v-else class="tree-entry-padding" />
						<a @click="stopClick" :href="`/${repository}/tree${path ? '/' + path : ''}/${entry.name}`">{{ entry.name }}</a>
					</div>
				</td>
				<td>
					<a @click="routeToCommit(entry.last_commit.id, $event)" :href="`/${repository}/log/${entry.last_commit.id}`">
						{{ entry.last_commit.message }}
					</a>
				</td>
				<td>
					{{ getPrettyLastUpdated(entry.last_commit.date) }}
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
			return formatDistance(new Date(date), new Date(), { addSuffix: true });
		}
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";

table {
	border-spacing: 0;
	width: 100%;
	margin-bottom: 1rem;
	tbody {
		vertical-align: inherit;
		tr {
			&:hover {
				background-color: lighten(colors.$background, 5%);
			}
			td {
				padding-bottom: 1em;
				padding-top: 5px;
				padding-bottom: 5px;
				padding-right: 2vw;
				vertical-align: middle;
				&:nth-child(2) a, &:nth-child(3) {
					font-weight: 300;
				}
			}
		}
	}
	thead {
		vertical-align: bottom;
	}
	th {
		text-align: start;
		padding-bottom: 1em;
		color: colors.$secondary;
	}
	> :not(caption) > * > * {
		padding: 0.2rem 1rem;
		border-bottom-width: 1px;
	}
	.tree-entry-padding, svg {
		width: 18px;
		padding-right: 5px;
	}
}

#log {
	padding-left: 0;
}

@media (max-width: 576px) {
	table > :not(caption) > * > * {
		padding: 0.1rem;
	}
}
.flex-center {
	display: flex;
	align-items: center;
}
</style>
