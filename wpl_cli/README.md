# Wen Program Library CLI

A command line interface for WEN New Standard program.

---

## Table of Contents

- [Installation](#installation)
- [Use case examples](#use-case-examples)

---

## Installation

One can build directly from source using `cargo`. Prerequisites for the binary to work is installing Rust on one's machine.

Install Rust via the command

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Users can fetch the required arguments for a command through the `--help` option. Example command listed below.

```sh
wpl asset --help
```

Should showcase the following help text

```sh
Asset related instructions

Usage: wpl asset [OPTIONS] <COMMAND>

Commands:
  create    Create a new asset
  get       Fetch an asset
  freeze    Freeze an asset
  thaw      Thaw an asset
  burn      Burn an asset
  royalty   Royalty based instructions for an asset
  metadata  Metadata based instructions for an asset
  help      Print this message or the help of the given subcommand(s)

Options:
  -r, --rpc <RPC>              RPC endpoint url to override using the Solana config
  -T, --timeout <TIMEOUT>      Timeout to override default value of 90 seconds [default: 90]
  -l, --log-level <LOG_LEVEL>  Log level [default: off]
  -k, --keypair <KEYPAIR>      Path to the owner keypair file
  -h, --help                   Print help
```

---

## Use case examples

The following use cases will focus only the arguments required and skipping the optional arguments (for example rpc, timeout, keypair etc).

---

### Creating a collection

```sh
wpl collection create [OPTIONS] --name <NAME> --symbol <SYMBOL> --uri <URI> --size <SIZE>
```

---

### Creating an asset

```sh
wpl asset create [OPTIONS] --name <NAME> --symbol <SYMBOL> --uri <URI>
```

#### Adding royalties to asset (Optional)

```sh
wpl asset royalty add [OPTIONS] --mint <MINT> --config-path <CONFIG_PATH>

-m, --mint <MINT>                Asset address
-c, --config-path <CONFIG_PATH>  Config file for royalties
```

### Appending additional metadata (Optional)

```sh
wpl asset metadata add [OPTIONS] --mint <MINT> --metadata-path <METADATA_PATH>

-m, --mint <MINT>                    Asset address
-M, --metadata-path <METADATA_PATH>  Config file for metadata
```

---

### Including assets into a collection

```sh
wpl collection asset add [OPTIONS] --mint <MINT> --asset-mint <ASSET_MINT>

-m, --mint <MINT>              Collection mint
-a, --asset-mint <ASSET_MINT>  Asset mint
```
