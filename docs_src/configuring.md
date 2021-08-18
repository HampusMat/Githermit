## Settings
You can configure Githermit with a `settings.json` file in the root of the project directory.

This file has both required and optional keys.

### Required
| Name    | Type   | Description                                   |
|---------|--------|-----------------------------------------------|
| host    | string | Desired host address                          |
| port    | number | Desired port                                  |
| title   | string | The title of the Githermit instance           |
| about   | string | A short description of the Githermit instance |
| git_dir | string | A directory with bare git repositories        |

### Optional

**cache:**<br>

| Name             | Type    | Description                                    | Default |
|------------------|---------|------------------------------------------------|---------|
| enabled          | boolean | Whether or not caching is enabled              | true    |
| ttl              | number  | How long cached data should last (in seconds)  | 120     |
| max              | number  | The maximum size of the cache (0 = infinity)   | 5000000 |
| refreshThreshold | number  | The time left on a cache key's ttl to refresh  | 80      |

**dev:**<br>

| Name | Type   | Description                                    |
|------|--------|------------------------------------------------|
| port | number | Desired port for the Vue.js development server |

<br>

## Examples
**Your normal everyday settings file:**
```
{
	"host": "localhost",
	"port": 80,
	"title": "Dave's cool git projects",
	"about": "Take a look on all of my awesome stuff!",
	"git_dir": "/var/git"
}
```

**An ideal settings file for development:**
```
{
	"host": "localhost",
	"port": 8080,
	"title": "Bob's cool programs",
	"about": "Cool, huh?",
	"git_dir": "/home/bob/git-projects",
	"dev": {
		"port": 8008
	},
	"cache": {
		"enabled": false
	}
}
```

