use anchor_lang::prelude::*;
use bytemuck::{Pod, Zeroable};
use spl_discriminator::SplDiscriminate;
use spl_pod::error::PodSliceError;
use spl_type_length_value::state::{TlvState, TlvStateBorrowed};

use crate::MetadataErrors;

#[account()]
pub struct TokenGroupAccount {}

impl TokenGroupAccount {
    pub fn len() -> usize {
        8 + TlvStateBorrowed::get_base_len() + std::mem::size_of::<TokenGroup>()
    }
}

/// Data struct for a `TokenGroup`
#[repr(C)]
#[derive(Clone, Copy, Debug, Default, Pod, Zeroable, PartialEq, SplDiscriminate)]
#[discriminator_hash_input("spl_token_group_interface:group")]
pub struct TokenGroup {
    /// The authority that can sign to update the group
    pub update_authority: Pubkey,
    /// The associated mint, used to counter spoofing to be sure that group
    /// belongs to a particular mint
    pub mint: Pubkey,
    /// The current number of group members
    pub size: u32,
    /// The maximum number of group members
    pub max_size: u32,
}

impl TokenGroup {
    /// Creates a new `TokenGroup` state
    pub fn new(mint: &Pubkey, update_authority: Pubkey, max_size: u32) -> Self {
        Self {
            mint: *mint,
            update_authority,
            size: 0,
            max_size,
        }
    }

    /// Updates the max size for a group
    pub fn update_max_size(&mut self, new_max_size: u32) -> Result<()> {
        // The new max size cannot be less than the current size
        if new_max_size < self.size {
            return Err(MetadataErrors::MaxSizeBelowCurrentSize.into());
        }
        self.max_size = new_max_size;
        Ok(())
    }

    /// Increment the size for a group, returning the new size
    pub fn increment_size(&mut self) -> Result<u32> {
        // The new size cannot be greater than the max size
        let new_size = self
            .size
            .checked_add(1)
            .ok_or::<ProgramError>(PodSliceError::CalculationFailure.into())?;
        if new_size > self.max_size {
            return Err(MetadataErrors::SizeExceedsMaxSize.into());
        }
        self.size = new_size;
        Ok(new_size)
    }

    /// Increment the size for a group, returning the new size
    pub fn decrement_size(&mut self) -> Result<u32> {
        // The new size cannot be greater than the max size
        let new_size = self
            .size
            .checked_sub(1)
            .ok_or::<ProgramError>(PodSliceError::CalculationFailure.into())?;
        self.size = new_size;
        Ok(new_size)
    }
}
