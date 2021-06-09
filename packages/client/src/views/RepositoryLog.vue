<template>
	<div class="row mx-0 vld-parent flex-fill">
		<div class="col ms-4 ps-4 ps-sm-5 mt-3">
			<table
				id="log" class="table table-dark fs-5"
				v-if="commits">
				<thead>
					<tr>
						<th class="text-secondary">
							Subject
						</th>
						<th class="text-secondary">
							Author
						</th>
						<th class="text-secondary">
							Date
						</th>
						<th class="text-secondary">
							Files
						</th>
						<th class="text-secondary">
							Del/Add
						</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(commit, index) in commits" :key="index">
						<td>
							<router-link :to="'log/' + commit['commit']">
								{{ commit["message"] }}
							</router-link>
						</td>
						<td>{{ commit["author_name"] }}</td>
						<td>{{ format(new Date(commit["date"]), "yyyy-MM-dd hh:mm") }}</td>
						<td>{{ commit["files_changed"] }}</td>
						<td><span class="text-danger">-{{ commit["deletions"] }}</span> / <span class="text-success">+{{ commit["insertions"] }}</span></td>
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
@import "../scss/bootstrap";
@import "../scss/fonts";

@import "~bootstrap/scss/tables";

#log {
	border-spacing: 0;
	tbody tr {
		&:hover {
			--bs-table-bg: 0;
			background-color: lighten(colors.$background, 5%);
		}
		td {
			padding-bottom: 1em;
		}
	}
	th {
		text-align: start;
		padding-bottom: 1em;
	}
}

@include media-breakpoint-down(sm) {
	.table > :not(caption) > * > * {
		padding: 0.1rem;
	}
}

</style>
