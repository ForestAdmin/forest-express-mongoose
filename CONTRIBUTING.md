# Contributing to forest-express-mongoose

forest-express-mongoose is the Forest **v1** agent for Express and Mongoose, in maintenance mode. Bug fixes are welcome here; new features go to [agent-nodejs](https://github.com/ForestAdmin/agent-nodejs).

## Before you start

- **Found a bug?** Open an issue with the template: expected behavior, actual behavior, logs, and your `forest-express-mongoose` and Mongoose versions.
- **Found a security issue?** Do not open a public issue. Follow the [security policy](https://github.com/ForestAdmin/.github/blob/main/SECURITY.md).

## Setup

Node.js `>= 16` is required.

```bash
yarn install --frozen-lockfile
docker compose up -d   # starts the test databases
```

## Tests and lint

```bash
yarn test
yarn test:coverage
yarn lint
```

Tests must pass and lint must be clean before you open a pull request.

## Commit messages

Commits follow the [Conventional Commits](https://www.conventionalcommits.org/) specification, enforced by commitlint. Releases and changelogs are generated from them by semantic-release: `fix: ...` produces a patch release, `docs: ...` or `chore: ...` none.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your fix, with a test that reproduces the bug.
3. Give the pull request a Conventional Commits title and fill in the template checklist.
4. The CI must be green. The Forest team reviews every pull request before merging.

## Code of conduct

Everyone taking part in this project is expected to follow the [code of conduct](https://github.com/ForestAdmin/.github/blob/main/CODE_OF_CONDUCT.md).
