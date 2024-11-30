# Merkle Tree CLI

This CLI tool allows you to create a Merkle tree from a CSV file of recipients.

## Prerequisites

- Rust and Cargo installed on your system

## Usage

1. First, move into the `merkle-tree-cli` folder:

   ```bash
   cd crates/merkle-tree-cli
   ```

2. Run the CLI tool using Cargo:

   ```bash
   cargo run create-merkle-tree --csv-path <path_to_csv> --merkle-tree-path <output_path>
   ```

   Replace `<path_to_csv>` with the path to your input CSV file, and `<output_path>` with the desired location for the output JSON file.

3. Example:

   ```bash
   cargo run create-merkle-tree --csv-path data/allow_list.csv --merkle-tree-path data/merkle-tree.json
   ```

## Example
