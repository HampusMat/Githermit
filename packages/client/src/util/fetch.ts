import { Ref } from "vue";

export default async function(endpoint: string, fetch_failed: Ref<string | null>, is_loading: Ref<boolean>, data_name: string): Promise<unknown | null> {
	const fetch_timeout = setTimeout(() => {
		if(!fetch_failed.value) {
			fetch_failed.value = `Failed to fetch ${data_name} data.`;
			is_loading.value = false;
		}
	}, 5000);

	const res = await fetch(`${window.location.protocol}//${window.location.host}/api/v1/${endpoint}`).catch(() => {
		if(!fetch_failed.value) {
			fetch_failed.value = `Failed to fetch ${data_name} data.`;
			is_loading.value = false;
			clearTimeout(fetch_timeout);
		}
		return null;
	});

	if(res !== null && res.ok) {
		const data: Record<string, unknown> | null = await res.json().catch(() => {
			fetch_failed.value = "Failed to parse server response.";
		});

		if(data) {
			clearTimeout(fetch_timeout);
			is_loading.value = false;
			return data.data;
		}
	}

	fetch_failed.value = `Failed to fetch ${data_name} data.`;

	clearTimeout(fetch_timeout);
	is_loading.value = false;
	return null;
}