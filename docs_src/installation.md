## Requirements

Githermit needs a multitude of packages to work properly.

You'll need to have Git installed (obviously). You should be able to simply install this with your package manager.<br>
For example:

`# apt-get install git`

Githermit also requires NodeJS. You can find a comprehensive guide on how to install it in [the NodeJS documentation](https://nodejs.dev/download/package-manager/).

And then there's a couple of packages that may or may not already be installed on your system.
- libpcre
- libpcreposix
- libkrb5
- libk5crypto
- libcom_err
- libssl-dev

## Setup

You should now install the Javascript dependencies with Yarn.

`$ yarn install`

And finally, build the project.

`$ yarn build`

The final step is to create a file called `settings.yml` with the following content.
```
host: (Host address)
port: (Port)
dev_port: (Port for development server)
production: (Set this to true unless you're doing changes to Githermit)
title: (Title of your Githermit instance)
about: (Short description of your Githermit instance)
base_dir: (Directory where all of your bare Git repositories are located)
```

## Starting
You can now run Githermit with
`$ yarn start`