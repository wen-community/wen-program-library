# Crates Folder

This folder contains Rust crates that are part of our project. These crates provide various functionalities and tools used across the project.

## Contents

### merkle-tree

A library crate that implements Merkle tree functionality. This crate provides the core logic for creating and manipulating Merkle trees.

### merkle-tree-cli

A binary crate that provides a command-line interface for interacting with Merkle trees. It uses the `merkle-tree` library to perform operations such as creating Merkle trees from CSV files.

Running instructions: merkle-tree-cli/README.md

### merkle-tree-verify

A library crate that provides verification functionality for Merkle trees. This crate can be used to verify proofs and validate the integrity of Merkle trees.

## Building

To build all crates in this folder, navigate to the `crates` directory and run:

```
cargo build
```

For optimized release builds, use:

```
cargo build --release
```

## Testing

To run all the rust tests for the crates, navigate to the `crates` direcory, build and run:

```
cargo test
```

## Dependencies

These crates use workspace-level dependencies. Refer to the root `Cargo.toml` file for the specific versions of dependencies used across the project.