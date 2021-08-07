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

## Development utilities
You can use the following command to run a live-updating instance of Githermit.

`$ yarn dev`