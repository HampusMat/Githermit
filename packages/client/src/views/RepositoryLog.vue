<template>
	<div class="row vld-parent">
		<div id="log" class="col">
			<table
				class="fs-5"
				v-if="commits">
				<thead>
					<tr>
						<th>
							Subject
						</th>
						<th>
							Author
						</th>
						<th>
							Date
						</th>
						<th>
							Files
						</th>
						<th>
							Del/Add
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(commit, index) in commits" :key="index">
						<td>
							<router-link :to="'log/' + commit.id">
								{{ commit.message }}
							</router-link>
						</td>
						<td>{{ commit.author.name }}</td>
						<td>{{ format(new Date(commit.date * 1000), "yyyy-MM-dd hh:mm") }}</td>
						<td>{{ commit.files_changed }}</td>
						<td class="add-del">
							<span>-{{ commit.deletions }}</span> / <span>+{{ commit.insertions }}</span>
						</td>
					</tr>
				</tbody>
			</table>
			<BaseErrorMessage :fetch-failed="fetch_failed" />
			<Loading
				:active="is_loading" :height="24"
				:width="24" color="#ffffff"
				:opacity="0" :is-full-page="false" />
		</div>
	</div>
</template>

<script>
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "@/components/BaseErrorMessage";
import { ref } from "vue";
import { format } from "date-fns";
import fetchData from "@/util/fetch";

export default {
	name: "RepositoryLog",
	components: {
		Loading,
		BaseErrorMessage
	},
	data() {
		return {
			format
		};
	},
	setup() {
		const commits = ref(null);
		const is_loading = ref(true);
		const fetch_failed = ref(null);

		const fetchLog = async(repository) => {
			const log_data = await fetchData(`repos/${repository}/log`, fetch_failed, is_loading, "log");
			if(log_data) {
				commits.value = log_data;
			}
		};

		return { commits, is_loading, fetch_failed, fetchLog };
	},
	created() {
		this.fetchLog(this.$router.currentRoute._rawValue.params.repo);
	}
};
</script>

<style lang="scss" scoped>
@use "../scss/colors";

@import "~vue-loading-overlay/dist/vue-loading.css";
@import "../scss/fonts";

table {
	border-spacing: 0;
	width: 100%;
	margin-bottom: 1rem;
	tbody {
		vertical-align: inherit;
		tr {
			&:hover {
				--bs-table-bg: 0;
				background-color: lighten(colors.$background, 5%);
			}
			td {
				padding-bottom: 0.5rem;
				padding-top: 0.5rem;
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
}

#log {
	padding-left: 0;
}

.add-del {
	span {
		&:nth-child(1) {
			color: colors.$success;
		}
		&:nth-child(2) {
			color: colors.$danger;
		}
	}
}

@media (max-width: 576px) {
	table > :not(caption) > * > * {
		padding: 0.1rem;
	}
}

</style>
