<template>
	<RepositoryNavbar active-page="log" />
	<div class="row mx-0">
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
import { format } from "date-fns";
import { watch, reactive, toRefs } from "vue";

export default {
	name: "RepositoryLog",
	components: {
		RepositoryNavbar
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
		const state = reactive({ commits: {} });

		watch(() =>
		{
			fetch(`http://localhost:1337/api/v1/repos/${props.repository}/log`)
				.then((res) => res.json())
				.then((data) => state.commits = data["data"]);
		});

		return {
			... toRefs(state)
		};
	}
}
</script>