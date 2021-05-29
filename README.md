# What is Githermit?
Githermit is a Git web interface with the purpose of being a way to show off your personal projects on your own hosted git server.

**Why was it created?**

For the sake of modernism.
Projects like [cgit](https://git.zx2c4.com/cgit/), [Gitweb](https://repo.or.cz/git.git/tree/HEAD:/gitweb) & [Stagit](https://codemadness.org/stagit.html) are written in decades-old programming languages that no one in their right mind would learn nowadays.

The goal of Githermit is to be an alternative to the aforementioned projects that is both easier to develop & easier to use.
I would argue that Javascript, Vue.js & Sass is much easier to comprehend and understand than C, Perl & even PHP. Especially for less experienced developers.

It's also because i hate the idea of the web server being seperate. I don't want to have to set up Nginx or Apache or whatever for just hosting a Git web interface.
Githermit requires no such thing. All the steps to get it set up are in [Usage](#Usage). Nothing more, nothing less.

# What is Githermit Not?
Githermit is **not** and will **never** be an alternative to services such as Gitlab and Github.

Githermit will probably **never** be as fast as cgit, Gitweb & Stagit. But that's okay. That's not the point.

# Progress
- [x] Log & commit pages
- [x] Cloning
- [ ] Refs page
- [ ] Tree page
- [ ] Blob page
- [ ] Markdown support
- [ ] Tests

# Usage

**Dependencies:**
- Git (obviously)
- Nodejs v14.16.0

Install all the dependencies
`npm install`

Build & bundle the frontend
`npm run build`

Create a file called `settings.yml` with following content
```
host: (host address)
port: (port)
title: (title of your Githermit instance)
about: (short description of your Githermit instance)
base_dir: (directory where all of your bare Git repositories are located)
```

You can now run it with
`npm start`

# Development
You're highly encouraged to [create a merge request](https://gitlab.com/HampusMat/githermit/-/merge_requests/new) if you're willing to contribute.

You can run the following command to easily get started with contributing
`npm run dev`

This will run an instance of Githermit with live-updating backend & frontend.