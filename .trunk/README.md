# Trunk checks

Install the [Trunk CLI](https://docs.trunk.io/code-quality/overview/getting-started/initialize-trunk)
and run `npm ci` to install the ESLint plugins from the lockfile. Trunk manages
its own pinned tools and runtimes; the repository's npm dependencies stay unchanged.

```sh
trunk check --no-fix
trunk check --all --no-fix
trunk fmt path/to/file
trunk upgrade --dry-run
```

Checks default to changed files and report new issues relative to the upstream
branch. Use `--show-existing --upstream=false` to see the full lint backlog for
selected files. Formatting and fixes are explicit; automatic commit/push hooks
are disabled.

ESLint uses the existing root rules plus the configuration in
`configs/.eslintrc.cjs`. The Trunk TypeScript project includes source, build
scripts, Jest files, and Cypress tests. Foundry globals and test/tool environments
are declared there. Keep ESLint at 8.57.0 until the legacy TypeScript ESLint
plugins and configuration are migrated together; the current Trunk plugin's
legacy command supports versions through 8.57.0.

Pinact stays at the plugin's known-good 4.0.0: version 5 removed the single-dash
flags used by plugin v1.11.0's SARIF wrapper. Upgrade it when the wrapper supports
the new CLI.

Handlebars templates use a syntax-only parser because Prettier's Glimmer parser
does not support all of this system's partial syntax. Python compendium scripts
use Ruff, Bandit, Black, and isort. Vendored JavaScript and upstream game-icons
assets are excluded from code formatting and image optimization. Generated
outputs and local configuration are excluded through Git ignore rules.

Review `trunk upgrade` changes: it can enable additional detected linters and
create configuration files. Commit configuration, not the ignored cache links,
logs, downloaded plugins, or local overrides.
