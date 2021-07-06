import { Ref } from "vue";

export default async function(endpoint: string, fetch_failed: Ref<string | null>, is_loading: Ref<boolean>, data_name: string) {
	const fetch_timeout = setTimeout(() => {
		if(!fetch_failed.value) {
			fetch_failed.value = `Failed to fetch ${data_name} data.`;
			is_loading.value = false;
		}
	}, 5000);

	const data_req = await fetch(`${window.location.protocol}//${window.location.host}/api/v1/${endpoint}`).catch(() => {
		if(!fetch_failed.value) {
			fetch_failed.value = `Failed to fetch ${data_name} data.`;
			is_loading.value = false;
			clearTimeout(fetch_timeout);
		}
		return null;
	});

	if(data_req !== null) {
		const data = await data_req.json().catch(() => {
			fetch_failed.value = "Failed to parse server response.";
		});

		if(data_req.ok) {
			clearTimeout(fetch_timeout);
			is_loading.value = false;
			return data.data;
		} else {
			fetch_failed.value = `Failed to fetch ${data_name} data.`;
		}
	}

	clearTimeout(fetch_timeout);
	is_loading.value = false;
	return null;
};
