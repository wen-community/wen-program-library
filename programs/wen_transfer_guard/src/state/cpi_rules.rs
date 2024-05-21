use anchor_lang::prelude::*;

use crate::error::WenTransferGuardError;

// Control which protocols can interact with a mint's tokens. eg only allow royalty respecting protocols to facilitate transfers.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CpiRule {
    Allow(Vec<Pubkey>),
    Deny(Vec<Pubkey>),
}

impl CpiRule {
    pub fn size_of(vec: Vec<Pubkey>) -> usize {
        1 +                             // Enum size
        4 + (vec.len() * 32) // Vec size
    }

    pub fn enforce_rule(&self, caller_program_id: &Pubkey) -> Result<()> {
        require!(
            match self {
                CpiRule::Allow(allow_vec) => allow_vec.contains(caller_program_id),
                CpiRule::Deny(deny_vec) => !deny_vec.contains(caller_program_id),
            },
            WenTransferGuardError::CpiRuleEnforceFailed
        );
        Ok(())
    }
}

// Enforce the transfer amount is above, below, equal to, or within a range set my the mint authority.
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
        8 + // u64 size
        8 // u64 size
    }

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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MetadataAdditionalFieldRestriction {
    Includes(Vec<String>),
    Excludes(Vec<String>),
}

impl MetadataAdditionalFieldRestriction {
    pub fn size_of(vec: Vec<String>) -> usize {
        1 + // Enum size
        4 + vec.iter().map(|s| s.len() + 4).sum::<usize>()
    }
}

// Ensure a field exists and if desired is equal to some value. If multiple rules are set then all must pass.
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
                    size += MetadataAdditionalFieldRestriction::size_of(includes);
                }
                MetadataAdditionalFieldRestriction::Excludes(excludes) => {
                    size += MetadataAdditionalFieldRestriction::size_of(excludes);
                }
            }
        }
        size
    }

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
    pub identifier: [u8; 32],
    pub bump: u8,
    pub cpi_rule: Option<CpiRule>,
    pub transfer_amount_rule: Option<TransferAmountRule>,
    pub addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
}

impl GuardV1 {
    pub fn size_of(
        cpi_rule: Option<CpiRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> usize {
        let mut size: usize = 0;
        size += 8; // Discriminator
        size += 1; // Bump
        size += 32; // Identifier

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

        size += 4; // Vec length

        // Additional fields rule size
        size += addition_fields_rule
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
        identifier: [u8; 32],
        bump: u8,
        cpi_rule: Option<CpiRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> Self {
        Self {
            identifier,
            bump,
            cpi_rule,
            transfer_amount_rule,
            addition_fields_rule,
        }
    }

    pub fn enforce_rules(
        &self,
        caller_program_id: Option<Pubkey>,
        amount: Option<u64>,
        metadata: &Vec<(String, String)>,
    ) -> Result<()> {
        if let Some(rule) = &self.cpi_rule {
            require!(
                caller_program_id.is_some(),
                WenTransferGuardError::CallerProgramIdNotPassedAsArgument
            );
            rule.enforce_rule(&caller_program_id.unwrap())?;
        }

        if let Some(rule) = &self.transfer_amount_rule {
            require!(
                amount.is_some(),
                WenTransferGuardError::AmountNotPassedAsArgument
            );
            rule.enforce_rule(amount.unwrap())?;
        }

        for rule in &self.addition_fields_rule {
            rule.enforce_rule(metadata)?;
        }

        Ok(())
    }
}
