# WEN Program Library

A collection of Solana programs maintained by the WEN developer community.


IDL and json in export folder.

## Contents

- [WEN Program Library](#wen-program-library)
  - [Contents](#contents)
  - [Overview](#overview)
  - [Building](#building)
  - [Testing](#testing)
  - [Programs](#programs)
    - [rarible\_marketplace `Rarim7DMoD45z1o25QWPsWvTdFSSEdxaxriwWZLLTic`](#rarible_marketplace-rarim7dmod45z1o25qwpswvtdfssedxaxriwwzlltic)
    - [rarible\_editions `Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn`](#rarible_editions-rari9ftbd6vfdtpn8tdlwn2ze24kkkm5mleetnibmnn)
    - [rarible\_editions\_controls `RariUNM3vz1rwxPg8UJyRAN7rSKXxgd2ncS2ddCa4ZE`](#rarible_editions_controls-rariunm3vz1rwxpg8ujyran7rskxxgd2ncs2ddca4ze)
      - [JavaScript](#javascript)
      - [Rust](#rust)
  - [Contributing](#contributing)
  - [CLI](#cli)
  - [License](#license)

## Overview

## Building

To build the programs from the root directory of the repository:

```bash
npx lerna run clean
```

```bash
yarn install
```

```bash
npx lerna run build
```

to install the required libraries, then:

```bash
anchor build
```

This will create program binaries at `<ROOT>/target/deploy/<program_name>.so` and IDLs at `<ROOT>/target/idl/<program_name>.json`.

## Testing

All program tests are located under the [`/tests`](./tests) directory:

```bash
anchor test
```

## Programs

This project contains the following programs:

### [rarible_marketplace](https://eclipsescan.xyz/account/Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn?cluster=testnet) `Rarim7DMoD45z1o25QWPsWvTdFSSEdxaxriwWZLLTic`

### [rarible_editions](https://eclipsescan.xyz/account/Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn?cluster=testnet) `Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn`

### [rarible_editions_controls](https://eclipsescan.xyz/account/Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn?cluster=testnet) `RariUNM3vz1rwxPg8UJyRAN7rSKXxgd2ncS2ddCa4ZE`

#### JavaScript

packages with lerna

#### Rust

TBD


## Contributing

Check out the [Contributing Guide](./CONTRIBUTING.md) the learn more about how to contribute to this project.

## CLI

The Rarible Program Library, now has a CLI allowing users to create collections and asset related operations.
## License

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
