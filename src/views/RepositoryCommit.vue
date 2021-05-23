<template>
	<RepositoryNavbar active-page="log" />
	<div class="row mx-0">
		<div class="col ms-2 ps-4 ps-sm-5 fs-5">
			<nav aria-label="breadcrumb">
				<ol class="breadcrumb">
					<li class="breadcrumb-item">
						<router-link :to="'/' + repository + '/log'">
							Log
						</router-link>
					</li>
					<li class="breadcrumb-item active" aria-current="page">
						{{ commit }}
					</li>
				</ol>
			</nav>
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
import { watch, reactive, toRefs } from "vue";
import { format } from "date-fns";

export default {
	name: "RepositoryCommit",
	components: {
		RepositoryNavbar,
		CommitPatch
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
		const state = reactive({ commit_data: {} });

		watch(() =>
		{
			fetch(`http://localhost:1337/api/v1/repos/${props.repository}/log/${props.commit}`)
				.then((res) => res.json())
				.then((data) =>
				{
					data["data"]["date"] = format(new Date(data["data"]["date"]), "yyyy-MM-dd hh:mm");
					state.commit_data = data["data"]
				});
		});

		return {
			... toRefs(state)
		};
	}
}
</script>
