<template>
	<RepositoryNavbar active-page="log" />
	<div class="row mx-0 vld-parent">
		<Loading
			v-model:active="is_loading" :height="24"
			:width="24" color="#ffffff"
			:opacity="0" />
		<div class="col ms-4 ps-4 ps-sm-5 mt-3">
			<table id="log" class="table table-dark fs-5">
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
		</div>
	</div>
</template>

<script>
import RepositoryNavbar from "../components/RepositoryNavbar";
import Loading from "vue-loading-overlay";
import 'vue-loading-overlay/dist/vue-loading.css';
import { format } from "date-fns";
import { watch, reactive, toRefs } from "vue";

export default {
	name: "RepositoryLog",
	components: {
		RepositoryNavbar,
		Loading
	},
	props: {
		repository: {
			type: String,
			required: true
		}
	},
	data()
	{
		return {
			format: format
		};
	},
	setup(props)
	{
		const state = reactive({ commits: {}, is_loading: true });

		watch(() =>
		{
			fetch(`${window.location.protocol}//${window.location.host}/api/v1/repos/${props.repository}/log`)
				.then((res) => res.json())
				.then((data) => {
					state.commits = data["data"];
					state.is_loading = false;
				});
		});

		return {
			... toRefs(state)
		};
	}
}
</script>