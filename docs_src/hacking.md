## The project structure
Githermit is what's called a monorepo and is thereof comprised of multiple packages. All of which resides in the 'packages' directory.

### Server
This package contains the backend. The brains of the operations.<br>
You can find extensive information about the internals of the backend [here](/docs/modules.html)

### Client
This package contains the frontend. Written is Vue.js, this is the soul of the project.

### API
This package contains interfaces and types shared by the server and client packages.

### Eslint-config-base
This package contains a base Eslint configuration for the server and client packages. Aswell as for the test environment.

## Important notes
You may want to add the following to your settings.json
```
"dev": {
	"port": (Port for the Vue.js development server)
}
```

## Development utilities
You can use the following command to run a live-updating instance of Githermit.

`$ yarn dev`

## Submitting patches
Contributing your code should be done through the [mailing list](https://lists.hampusmat.com/mailman3/lists/githermit.lists.hampusmat.com/).

Here's some guidelines for a higher possibility of a merge.
- Write short & descriptive commit messages that follow the [Conventional Commits specification](https://www.conventionalcommits.org)
- Make separate commits for logically separate changes.
- Sign off your patches


