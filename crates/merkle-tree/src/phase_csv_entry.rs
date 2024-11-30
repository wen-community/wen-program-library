use std::{fs::File, path::PathBuf, result};

use serde::{Deserialize, Serialize};

use crate::error::MerkleTreeError;

pub type Result<T> = result::Result<T, MerkleTreeError>;

/// Represents a single entry in a CSV for phase allow list
#[derive(Debug, Clone, Eq, Hash, PartialEq, Serialize, Deserialize)]
pub struct PhaseCsvEntry {
    /// Address of the claimant
    pub address: String,
    /// Price to claim for this address
    pub price: u64,
    /// Maximum number of claims allowed for this addressL
    pub max_claims: u64,
}

impl PhaseCsvEntry {
    pub fn new_from_file(path: &PathBuf) -> Result<Vec<Self>> {
        let file = File::open(path)?;
        let mut rdr = csv::Reader::from_reader(file);

        let mut entries = Vec::new();
        for result in rdr.deserialize() {
            let record: PhaseCsvEntry = result.unwrap();
            entries.push(record);
        }

        Ok(entries)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_csv_parsing() {
        let path = PathBuf::from("./test/test_fixtures/test_phase_csv.csv");
        let entries = PhaseCsvEntry::new_from_file(&path).expect("Failed to parse CSV");

        assert_eq!(entries.len(), 3);

        assert_eq!(
            entries[0].address,
            "4SX6nqv5VRLMoNfYM5phvHgcBNcBEwUEES4qPPjf1EqF"
        );
        assert_eq!(entries[0].price, 100000);
        assert_eq!(entries[0].max_claims, 12);
    }
}
