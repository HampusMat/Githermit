# What is Githermit?
Githermit is a Git web interface with the purpose of being a way to show off your personal projects on your own hosted git server.

**Why was it created?**

For the sake of modernism.
Projects like [cgit](https://git.zx2c4.com/cgit/), [Gitweb](https://repo.or.cz/git.git/tree/HEAD:/gitweb) & [Stagit](https://codemadness.org/stagit.html) are written in decades-old programming languages that no one in their right mind would even bother to learn nowadays.

The goal of Githermit is to be an alternative to the aforementioned projects that is more maintainable, extensible, customizable & usable.

It's also because i hate the idea of the web server being seperate. I don't want to have to set up Nginx or Apache or whatever for just hosting a Git web interface.
Githermit requires no such thing. All the steps to get it set up are in [Usage](#Installation). Nothing more, nothing less.

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
- [x] Tests
- [x] Fix the stupid bug caused by empty patches
- [ ] Branch switching
- [x] Custom favicon support
- [x] Custom website title support
- [ ] [Redesign](https://www.figma.com/file/r8P4m4SFTFkPfxkfoRrhtV/Githermit)
- [x] Documentation
- [x] GPG support
- [ ] Refactor

# Installation
You can find installation instructions in [the documentation](/docs_src/installation.md)

# Contributing
Any contribution or support is very welcome.

## Hacking
You can find information about development in [the documentation](/docs_src/hacking.md)

Join the [mailing list](https://lists.hampusmat.com/mailman3/lists/githermit.lists.hampusmat.com/) for discussions, news & submitting patches.

## Donating
Monero: `49nv1PMFiamBhiiNkzP66H7zmogDEWsDaaUxDdQN2Ne5g7mErYy1upRRgPeVwPYB1r9YArktDiJSFdKUnRF1zf5fECoJRss`

Bitcoin: `bc1q5hxt9fz4sq7haju8gug8dm4v6422mzcfsnhyfe`
