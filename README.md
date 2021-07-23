# What is Githermit?
Githermit is a Git web interface with the purpose of being a way to show off your personal projects on your own hosted git server.

**Why was it created?**

For the sake of modernism.
Projects like [cgit](https://git.zx2c4.com/cgit/), [Gitweb](https://repo.or.cz/git.git/tree/HEAD:/gitweb) & [Stagit](https://codemadness.org/stagit.html) are written in decades-old programming languages that no one in their right mind would even bother to learn nowadays.

The goal of Githermit is to be an alternative to the aforementioned projects that is easier to maintain, customize & use.

It's also because i hate the idea of the web server being seperate. I don't want to have to set up Nginx or Apache or whatever for just hosting a Git web interface.
Githermit requires no such thing. All the steps to get it set up are in [Usage](#Usage). Nothing more, nothing less.

# What is Githermit Not?
- An alternative to services such as Gitlab and Github.
- As fast as cgit, Gitweb & Stagit. But that's okay. That's not the point.

# Todo
- [x] Log & commit pages
- [x] Cloning
- [ ] Refs page
- [x] Tree page
- [x] Blob page
- [x] Markdown support
- [ ] Tests
- [x] Fix the stupid bug caused by empty patches
- [ ] Branch switching
- [x] Custom favicon support
- [x] Custom website title support
- [ ] [Redesign](https://www.figma.com/file/r8P4m4SFTFkPfxkfoRrhtV/Githermit)
- [ ] Documentation

# Usage
**Dependencies:**
- Git (obviously)
- Nodejs v14.16.0
- libpcre
- libpcreposix
- libkrb5
- libk5crypto
- libcom_err
- libssl-dev

**Install all the Javascript dependencies**

`$ yarn install`

Build & bundle the frontend

`$ yarn build`

Create a file called `settings.yml` with following content
```
host: (Host address)
port: (Port)
dev_port: (Port for development server)
production: (Set this to true unless you're doing changes to Githermit)
title: (Title of your Githermit instance)
about: (Short description of your Githermit instance)
base_dir: (Directory where all of your bare Git repositories are located)
```

You can now run it with
`$ yarn start`

# Development
You're highly encouraged to [create a merge request](https://gitlab.com/HampusMat/githermit/-/merge_requests/new) if you're willing to contribute.

You can run the following command to easily get started with contributing

`$ yarn dev`

This will run an instance of Githermit with live-updating backend & frontend.
