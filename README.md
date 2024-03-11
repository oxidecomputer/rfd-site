# RFD Site

## Table of Contents

- [Introduction](#rfd-site)
- [Technology](#the-technology)
- [Contributing](#contributing)
  - [Setup](#setup)
- [Running](#running)
  - [Running Locally](#running-locally)
  - [Write RFDs Locally](#write-rfds-locally)
- [License](#license)

## Introduction

At Oxide, RFDs (Requests for Discussion) play a crucial role in driving our architectural
and design decisions. They document the processes, APIs, and tools that we use. To learn
more about the RFD process, you can read
[RFD 1: Requests for Discussion](https://rfd.shared.oxide.computer/rfd/0001).

This repo represents the web frontend for browsing, searching, and reading RFDs, not to be
confused with [`oxidecomputer/rfd`](https://github.com/oxidecomputer/rfd), a private repo
that houses RFD content and discussion, or
[`oxidecomputer/rfd-api`](https://github.com/oxidecomputer/rfd-api), the backend that serves
RFD content to this site and gives us granular per-user control over RFD access. You can
read more about this site and how we use it in our blog post
[A Tool for Discussion](https://oxide.computer/blog/a-tool-for-discussion).

## Technology

The site is built with [Remix](https://remix.run/), a full stack React web framework.
[rfd-api](https://github.com/oxidecomputer/rfd-api) collects the RFDs from
`oxidecomputer/rfd` stores it in a database, and serves it through an HTTP API, which this
site uses. RFD discussions come from an associated pull request on GitHub. These are linked
to from the document and displayed inline alongside the text.

Documents are rendered with
[react-asciidoc](https://github.com/oxidecomputer/react-asciidoc), a work-in-progress React
AsciiDoc renderer we've created, built on top of
[`asciidoctor.js`](https://github.com/asciidoctor/asciidoctor.js).

## Deploying

Our site is hosted on Vercel and this repo uses the Vercel adapter, but Remix can be
deployed to [any JS runtime](https://remix.run/docs/en/main/discussion/runtimes).

## Contributing

This repo is public because others are interested in the RFD process and the tooling we've
built around it. In its present state, it's the code we're using on our
[deployed site](https://rfd.shared.oxide.computer/) and is tightly coupled to us and our
[design system](https://github.com/oxidecomputer/design-system). We're open to PRs that
improve this site, especially if they make the repo easier for others to use and contribute
to. However, we are a small company, and the primary goal of this repo is as an internal
tool for Oxide, so we can't guarantee that PRs will be integrated.

## Running

### Setup

`npm` v7 or higher is recommended due to
[`lockfileVersion: 2`](https://docs.npmjs.com/cli/v8/configuring-npm/package-lock-json#lockfileversion)
in `package-lock.json`.

```sh
npm install
```

### Running Locally

```sh
npm run dev
```

and go to [http://localhost:3000](http://localhost:3000). The site will live-reload on file
changes. The site should work with local RFDs (without search) without having to set any env
vars. See below on how to set up local RFD preview.

### Write RFDs Locally

To preview an RFD you're working on in the site, use the `LOCAL_RFD_REPO` env var to tell
the site to pull content from your local clone of the `rfd` repo instead of the API. No
other env vars (such as the ones that let you talk to CIO) are required. For example:

```sh
LOCAL_RFD_REPO=~/oxide/rfd npm run dev
```

Then go to `localhost:3000/rfd/0123` as normal. When you edit the file in the other repo,
the page will reload automatically. The index also works in local mode: it lists all RFDs it
can see locally.

Note that this does not pull RFDs from all branches like the production site does. It simply
reads files from the specified directory, so it will only have access to files on the
current branch. Missing RFDs will 404. If you are working on two RFDs and they're on
different branches, you cannot preview both at the same time unless you make a temporary
combined branch that contains both.

## License

Unless otherwise noted, all components are licensed under the
[Mozilla Public License Version 2.0](LICENSE).
