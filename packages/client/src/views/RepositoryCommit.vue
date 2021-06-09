<template>
	<div class="row mx-0">
		<div class="col ms-2 ps-4 ps-sm-5 fs-5 vld-parent">
			<BaseBreadcrumb :items="[{ name: 'Log', path: '/' + $router.currentRoute._rawValue.params.repo + '/log' }]" :active-item="$router.currentRoute._rawValue.params.commit" />
			<template v-if="commit">
				<table
					id="commit-info" class="table table-dark">
					<tbody>
						<tr>
							<td class="commit-info-title">
								Author
							</td>
							<td>{{ commit["author"] }}</td>
						</tr>
						<tr>
							<td class="commit-info-title">
								Date
							</td>
							<td>{{ commit["date"] }}</td>
						</tr>
						<tr>
							<td class="commit-info-title">
								Message
							</td>
							<td>{{ commit["message"] }}</td>
						</tr>
					</tbody>
				</table>
				<div
					v-for="(patch, index) in commit['patches']" :key="index"
					class="commit-patch">
					<div class="commit-patch-header">
						<span class="fw-bold">{{ (patch.to === "/dev/null") ? patch.from : patch.to }} </span>
						<span v-if="patch.to === '/dev/null'">Deleted</span>
						<div class="commit-patch-add-del">
							<span>+{{ patch.additions }}</span>
							<span>-{{ patch.deletions }}</span>
						</div>
					</div>
					<CommitPatch :patch="patch" />
				</div>
			</template>
			<BaseErrorMessage :fetch-failed="fetch_failed" />
			<Loading
				:active="is_loading" :height="24"
				:width="24" color="#ffffff"
				:opacity="0" :is-full-page="false" />
		</div>
	</div>
</template>

<script>
import BaseBreadcrumb from "@/components/BaseBreadcrumb";
import CommitPatch from "@/components/CommitPatch";
import Loading from "vue-loading-overlay";
import BaseErrorMessage from "@/components/BaseErrorMessage";
import { ref } from "vue";
import { format } from "date-fns";
import fetchData from "@/util/fetch";

export default {
	name: "RepositoryCommit",
	components: {
		BaseBreadcrumb,
		Loading,
		CommitPatch,
		BaseErrorMessage
	},
	setup() {
		const commit = ref(null);
		const is_loading = ref(true);
		const fetch_failed = ref(null);

		const fetchCommit = async(repository, commit_id) => {
			const commit_data = await fetchData(`repos/${repository}/log/${commit_id}`, fetch_failed, is_loading, "commit");

			if(commit_data) {
				commit_data.date = format(new Date(commit_data.date), "yyyy-MM-dd hh:mm");
				commit.value = commit_data;
			}
		};

		return { commit, is_loading, fetch_failed, fetchCommit };
	},
	created() {
		this.fetchCommit(this.$router.currentRoute._rawValue.params.repo, this.$router.currentRoute._rawValue.params.commit);
	}
};
</script>

<style lang="scss">
@use "../scss/colors";
@import "../scss/bootstrap";

@import "~bootstrap/scss/tables";

@import "~vue-loading-overlay/dist/vue-loading.css";
@import "~highlight.js/scss/srcery.scss";

#commit-info {
	margin-bottom: 2rem;
	tbody tr {
		td {
			padding: 0px;
			padding-right: 10px;
		}
	}
}

.commit-patch {
	margin-bottom: 50px;
	table {
		padding-top: 15px;
		tbody tr td {
			padding: 0px;
			padding-left: 8px;
			vertical-align: top;
			&:nth-child(2) {
				padding-right: 7px;
			}
			&:nth-child(3) {
				padding-right: 15px;
			}
		}
	}
}

.commit-patch-add-del {
	margin-left: auto;
	margin-right: 23px;
	span {
		margin-right: 10px !important;
		font-weight: 700;
		&:nth-child(1) {
			color: colors.$new;
		}
	}
}

.commit-patch-header {
	display: flex;
	background-color: lighten(#000000, 14%);
	padding: 10px;
	span {
		margin-right: 30px;
		&:nth-child(2) {
			color: colors.$danger;
		}
	}
}

.commit-info-title {
	color: colors.$secondary;
	padding-right: 30px;
	width: 20px;
}

.patch-too-large {
	font-weight: 600;
}

.commit-file-pos-change {
	color: colors.$text-gray;
}

.commit-file-no-newline {
	color: colors.$text-gray;
}

.line-new {
	color: colors.$new;
}
.line-deleted {
	color: colors.$danger;
}

.line-unchanged {
	color: colors.$text-gray;
}

[patch-line-col-unsel]::before {
	content: attr(patch-line-col-unsel);
}

.line-highlight-new {
	border-right: 1px solid colors.$new;
}
.line-highlight-deleted {
	border-right: 1px solid colors.$danger;
}

code {
	white-space: pre-wrap;
	word-wrap: anywhere;
}

.row {
	height: 100%;
}

@include media-breakpoint-down(sm) {
	.commit-patch table tbody tr td {
		padding-left: 4px;
		&:nth-child(2) {
			padding-right: 4px;
		}
		&:nth-child(3) {
			padding-right: 5px;
		}
	}
}
</style>
