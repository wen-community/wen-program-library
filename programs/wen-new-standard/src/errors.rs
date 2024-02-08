use anchor_lang::prelude::*;

#[error_code]
pub enum MetadataErrors {
    #[msg("Collection size exceeds max size.")]
    SizeExceedsMaxSize,
    #[msg("Max size cannot be reduced below current size.")]
    MaxSizeBelowCurrentSize,
}
