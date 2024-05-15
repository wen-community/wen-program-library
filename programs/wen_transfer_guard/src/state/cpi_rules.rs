use anchor_lang::prelude::*;

// Control which protocols can interact with a mint's tokens. eg only allow royalty respecting protocols to facilitate transfers.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum CPIRule {
    Allow(Vec<Pubkey>),
    Deny(Vec<Pubkey>),
}

impl CPIRule {
    pub fn size_of(allow_vec: Vec<Pubkey>, deny_vec: Vec<Pubkey>) -> usize {
        1 +                                 // Enum size
        (4 + (allow_vec.len() * 32)) +      // Allow size
        (4 + (deny_vec.len() * 32)) // Deny size
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
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum MetadataAdditionalFieldRestriction {
    Includes(Vec<String>),
    Excludes(Vec<String>),
}

impl MetadataAdditionalFieldRestriction {
    pub fn size_of(includes_vec: Vec<String>, excludes_vec: Vec<String>) -> usize {
        1 + // Enum size
        4 + includes_vec.iter().map(|s| s.len() + 4).sum::<usize>() + // Includes size, Strings are vecs so + 4 on each
        4 + excludes_vec.iter().map(|s| s.len() + 4).sum::<usize>() // Excludes size, Strings are vecs so + 4 on each
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
        4 + field.len() + // Field size
        1 + // Option size
        match value_restrictions {
            Some(restriction) => MetadataAdditionalFieldRestriction::size_of(
                match &restriction {
                    MetadataAdditionalFieldRestriction::Includes(includes) => includes.to_vec(),
                    MetadataAdditionalFieldRestriction::Excludes(_) => vec![],
                },
                match &restriction {
                    MetadataAdditionalFieldRestriction::Includes(_) => vec![],
                    MetadataAdditionalFieldRestriction::Excludes(excludes) => excludes.to_vec(),
                },
            ),
            None => 0,
        }
    }
}

#[account]
pub struct GuardV1 {
    bump: u8,
    cpi_rule: Option<CPIRule>,
    transfer_amount_rule: Option<TransferAmountRule>,
    addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
}

impl GuardV1 {
    pub fn size_of(
        cpi_rule: Option<CPIRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> usize {
        1 + // Bump
        1 + match cpi_rule {
            Some(rule) => CPIRule::size_of(
                match &rule {
                    CPIRule::Allow(allow_vec) => allow_vec.to_vec(),
                    CPIRule::Deny(_) => vec![],
                },
                match &rule {
                    CPIRule::Allow(_) => vec![],
                    CPIRule::Deny(deny_vec) => deny_vec.to_vec(),
                },
            ),
            None => 0,
        } + 1
            + match transfer_amount_rule {
                Some(_) => TransferAmountRule::size_of(),
                None => 0,
            }
            + 4
            + addition_fields_rule
                .iter()
                .map(|rule| {
                    MetadataAdditionalFieldRule::size_of(
                        rule.field.clone(),
                        rule.value_restrictions.clone(),
                    )
                })
                .sum::<usize>()
    }

    pub fn new(
        bump: u8,
        cpi_rule: Option<CPIRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> Self {
        Self {
            bump,
            cpi_rule,
            transfer_amount_rule,
            addition_fields_rule,
        }
    }
}
