use anchor_lang::prelude::*;

use crate::error::WenTransferGuardError;

/// Controls which protocols can interact with the token by
/// enforcing Allow and Deny lists.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CpiRule {
    Allow(Vec<Pubkey>),
    Deny(Vec<Pubkey>),
}

impl CpiRule {
    pub fn size_of(vec: Vec<Pubkey>) -> usize {
        1 + // Enum size
        4 + (vec.len() * 32) // Vec size
    }

    /// Enforces the CPI rule set in the guard by
    /// checking if the caller program id is in the allow
    /// list or in the deny list, depending on the ruleset.
    ///
    /// ### Arguments
    ///
    /// * `caller_program_id` - The program id of the caller program.
    ///
    /// ### Errors
    ///
    /// * `CpiRuleEnforcementFailed` - The caller program id is not in the allow list or is in the deny list.
    ///
    pub fn enforce_rule(&self, caller_program_id: &Pubkey) -> Result<()> {
        require!(
            match self {
                CpiRule::Allow(allow_vec) => allow_vec.contains(caller_program_id),
                CpiRule::Deny(deny_vec) => !deny_vec.contains(caller_program_id),
            },
            WenTransferGuardError::CpiRuleEnforcementFailed
        );
        Ok(())
    }
}

/// Enforces rules on the amount of tokens being transferred.
/// The rules can be above, below, equal to, or within a range.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum TransferAmountRule {
    Above(u64),
    Below(u64),
    Equal(u64),
    Rang(u64, u64),
}

impl TransferAmountRule {
    pub fn size_of() -> usize {
        1 + // Enum size
        (8 + 8) // (u64, u64) size (Largest enum variant)
    }

    /// Enforces the transfer amount rule set in the guard.
    /// The rule can be above, below, equal to, or within a range.
    /// If the rule is not met, an error is returned.
    ///
    /// ### Arguments
    ///
    /// * `amount` - The amount of tokens being transferred.
    ///
    /// ### Errors
    ///
    /// * `TransferAmountRuleEnforceFailed` - The transfer amount rule was not met.
    ///
    pub fn enforce_rule(&self, amount: u64) -> Result<()> {
        match self {
            TransferAmountRule::Above(above) => {
                require!(
                    amount > *above,
                    WenTransferGuardError::TransferAmountRuleEnforceFailed
                );
            }
            TransferAmountRule::Below(below) => {
                require!(
                    amount < *below,
                    WenTransferGuardError::TransferAmountRuleEnforceFailed
                );
            }
            TransferAmountRule::Equal(equal) => {
                require!(
                    amount == *equal,
                    WenTransferGuardError::TransferAmountRuleEnforceFailed
                );
            }
            TransferAmountRule::Rang(min, max) => {
                require!(
                    amount > *min && amount < *max,
                    WenTransferGuardError::TransferAmountRuleEnforceFailed
                );
            }
        }
        Ok(())
    }
}

/// Inner enum for the MetadataAdditionalFieldRestriction enum.
/// * Includes - The field must include one of the values in the vector.
/// * Excludes - The field must not include any of the values in the vector.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MetadataAdditionalFieldRestriction {
    Includes(Vec<String>),
    Excludes(Vec<String>),
}

impl MetadataAdditionalFieldRestriction {
    pub fn size_of(vec: Vec<String>) -> usize {
        1 + // Enum size
        4 + vec.iter().map(|s| s.len() + 4).sum::<usize>() // 4 bytes for vector, plus each string is also a vector so + 4 and length of string
    }
}

/// Enforces rules on a single additional field in the mint metadata.
/// The field must exist and the value must pass the restriction.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub struct MetadataAdditionalFieldRule {
    field: String,
    value_restrictions: Option<MetadataAdditionalFieldRestriction>,
}

impl MetadataAdditionalFieldRule {
    pub fn size_of(
        field: String,
        value_restrictions: Option<MetadataAdditionalFieldRestriction>,
    ) -> usize {
        let mut size = 0;
        size += 4 + field.len(); // Field
        size += 1; // Option
        if let Some(restriction) = value_restrictions {
            match restriction {
                MetadataAdditionalFieldRestriction::Includes(includes) => {
                    // Add size of includes
                    size += MetadataAdditionalFieldRestriction::size_of(includes);
                }
                MetadataAdditionalFieldRestriction::Excludes(excludes) => {
                    // Add size of excludes
                    size += MetadataAdditionalFieldRestriction::size_of(excludes);
                }
            }
        }
        size
    }

    /// Enforces the additional field rule set in the guard by
    /// checking if the field exists and if the value passes the restriction.
    ///
    /// If the restrictions vector is empty, the only requirement is that the field exists.
    ///
    /// ### Arguments
    ///
    /// * `metadata` - The mint metadata.
    ///
    /// ### Errors
    ///
    /// * `MetadataFieldDoesNotExist` - The field does not exist in the metadata.
    /// * `MetadataFieldDoesNotPass` - The field value does not pass the restriction.
    ///
    pub fn enforce_rule(&self, metadata: &Vec<(String, String)>) -> Result<()> {
        let mut field_exists = false;
        let mut field_value_passes = false;

        for (key, value) in metadata {
            if key == &self.field {
                field_exists = true;
                if let Some(restriction) = &self.value_restrictions {
                    match restriction {
                        MetadataAdditionalFieldRestriction::Includes(includes) => {
                            if includes.contains(value) {
                                field_value_passes = true;
                                break;
                            }
                        }
                        MetadataAdditionalFieldRestriction::Excludes(excludes) => {
                            if !excludes.contains(value) {
                                field_value_passes = true;
                            } else {
                                field_value_passes = false;
                                break;
                            }
                        }
                    }
                } else {
                    field_value_passes = true;
                }
            }
        }

        require!(
            field_exists,
            WenTransferGuardError::MetadataFieldDoesNotExist
        );
        if self.value_restrictions.is_some() {
            require!(
                field_value_passes,
                WenTransferGuardError::MetadataFieldDoesNotPass
            );
        }
        Ok(())
    }
}

#[account]
pub struct GuardV1 {
    /// Mint token representing the guard, do not confuse with the mint of the token being transferred.
    pub mint: Pubkey,
    /// Bump seed for the guard account.
    pub bump: u8,
    /// CPI ruleset for the guard.
    pub cpi_rule: Option<CpiRule>,
    /// Transfer amount ruleset for the guard.
    pub transfer_amount_rule: Option<TransferAmountRule>,
    /// Additional fields ruleset for the guard.
    pub additional_fields_rule: Vec<MetadataAdditionalFieldRule>,
}

impl GuardV1 {
    pub fn size_of(
        cpi_rule: Option<CpiRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        additional_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> usize {
        let mut size: usize = 0;
        size += 8; // Discriminator
        size += 1; // Bump
        size += 32; // Mint

        size += 1; // Option (CPIRule)

        // CpiRule size (if present)
        if let Some(rule) = cpi_rule {
            match rule {
                CpiRule::Allow(allow_vec) => {
                    size += CpiRule::size_of(allow_vec);
                }
                CpiRule::Deny(deny_vec) => {
                    size += CpiRule::size_of(deny_vec);
                }
            }
        }

        size += 1; // Option (TransferAmountRule)

        // Transfer amount rule size (if present)
        if let Some(_) = transfer_amount_rule {
            size += TransferAmountRule::size_of();
        }

        size += 4; // addition_fields_rules vec length

        // Additional fields rule size
        size += additional_fields_rule
            .iter()
            .map(|rule| {
                MetadataAdditionalFieldRule::size_of(
                    rule.field.clone(),
                    rule.value_restrictions.clone(), // TODO: Clean up clone
                )
            })
            .sum::<usize>();

        size
    }

    pub fn new(
        mint: Pubkey,
        bump: u8,
        cpi_rule: Option<CpiRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> Self {
        Self {
            mint,
            bump,
            cpi_rule,
            transfer_amount_rule,
            additional_fields_rule: addition_fields_rule,
        }
    }

    pub fn update(
        &mut self,
        cpi_rule: Option<CpiRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) {
        self.cpi_rule = cpi_rule;
        self.transfer_amount_rule = transfer_amount_rule;
        self.additional_fields_rule = addition_fields_rule;
    }

    /// Enforce all rules set in the guard.
    ///
    /// ### Arguments
    /// 
    /// * `metadata` - The mint metadata.
    /// * `amount` - The amount of tokens being transferred.
    /// * `caller_program_id` - The program id of the caller program.
    /// 
    /// ### Errors
    /// 
    /// * `CpiRuleEnforcementFailed` - The caller program id is not in the allow list or is in the deny list.
    /// * `TransferAmountRuleEnforceFailed` - The transfer amount rule was not met.
    /// * `MetadataFieldDoesNotExist` - The field does not exist in the metadata.
    /// * `MetadataFieldDoesNotPass` - The field value does not pass the restriction.
    /// 
    pub fn enforce_rules(
        &self,
        metadata: &Vec<(String, String)>,
        amount: u64,
        caller_program_id: Pubkey,
    ) -> Result<()> {
        if let Some(rule) = &self.cpi_rule {
            rule.enforce_rule(&caller_program_id)?;
        }

        if let Some(rule) = &self.transfer_amount_rule {
            rule.enforce_rule(amount)?;
        }

        for rule in &self.additional_fields_rule {
            rule.enforce_rule(metadata)?;
        }

        Ok(())
    }
}
