# Contributing to WEN Program Library

## Getting Started

The [`package.json`](./package.json) file at the root folder contains dependencies and scripts for managing the program library.

To install the required dependencies, run:

```bash
yarn install
```

### Installing Anchor CLI

Use `avm` to install the Anchor CLI. All programs currently use Anchor version `0.30.0`.

```bash
cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.0 avm --locked
avm install latest
avm use latest
anchor --version
# Should output: anchor-cli 0.30.0
```

### Available Commands

- `lint` - Lints JavaScript and TypeScript files.
- `lint:fix` - Fixes lint issues.
- `version` - Creates a changelog using the git history of the repository.
- `clients` - Generates Rust and TypeScript clients for all programs.

## Managing Clients

Each client has its own README with instructions on how to get started. You can find them in the `clients` folder.

To generate the clients, run the following command:

```bash
yarn clients
```

You will need to run `pnpm clients` again to re-generate the clients whenever there are changes in the program(s).

## Releasing

Versions are determined by the [`package.json`](/package.json).

1. Run `anchor build` to generate IDLs for the programs `/target/idls`.
2. Increment the package version `<MAJOR>.<MINOR>.<PATCH>`
3. Run `yarn clients` to re-generate program rust and js SDKs.
4. Increment [`programs`](/programs) and [`clients`](/clients) based on the programs changed.
5. Commit the version bumps to git.
6. Run `yarn version`. This will create a changelog based on the git history of the repository.

After reach out in the WNS Developer Telegram group to publish SDKs. In the future this will be automated using github actions.