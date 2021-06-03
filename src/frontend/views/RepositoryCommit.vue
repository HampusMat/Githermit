<template>
	<RepositoryNavbar active-page="log" :repository="repository" />
	<div class="row mx-0">
		<div class="col ms-2 ps-4 ps-sm-5 fs-5 vld-parent">
			<BaseBreadcrumb :items="[{ name: 'Log', path: '/' + repository + '/log' }]" :active-item="commit" />
			<Loading
				v-model:active="is_loading" :height="24"
				:width="24" color="#ffffff"
				:opacity="0" />
			<table id="commit-info" class="table table-dark">
				<tbody>
					<tr>
						<td class="commit-info-title">
							Author
						</td>
						<td>{{ commit_data["author"] }}</td>
					</tr>
					<tr>
						<td class="commit-info-title">
							Date
						</td>
						<td>{{ commit_data["date"] }}</td>
					</tr>
					<tr>
						<td class="commit-info-title">
							Message
						</td>
						<td>{{ commit_data["message"] }}</td>
					</tr>
				</tbody>
			</table>

			<template
				v-for="(patch, index) in commit_data['patches']" :key="index">
				<CommitPatch :patch="patch" />
			</template>
		</div>
	</div>
</template>

<script>
import RepositoryNavbar from "../components/RepositoryNavbar";
import CommitPatch from "../components/CommitPatch";
import BaseBreadcrumb from "../components/BaseBreadcrumb";
import Loading from "vue-loading-overlay";
import 'vue-loading-overlay/dist/vue-loading.css';
import { watch, reactive, toRefs } from "vue";
import { format } from "date-fns";

export default {
	name: "RepositoryCommit",
	components: {
		RepositoryNavbar,
		CommitPatch,
		Loading,
		BaseBreadcrumb
	},
	props: {
		repository: {
			type: String,
			required: true
		},
		commit: {
			type: String,
			required: true
		}
	},
	setup(props)
	{
		const state = reactive({ commit_data: {}, is_loading: true });

		watch(() =>
		{
			fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${props.repository}/log/${props.commit}`)
				.then((res) => res.json())
				.then((data) =>
				{
					data["data"]["date"] = format(new Date(data["data"]["date"]), "yyyy-MM-dd hh:mm");
					state.commit_data = data["data"];
					state.is_loading = false;
				});
		});

		return {
			... toRefs(state)
		};
	}
};
</script>
