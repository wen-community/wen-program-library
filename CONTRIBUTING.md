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

You will need to run `yarn clients` again to re-generate the clients whenever there are changes in the program(s).