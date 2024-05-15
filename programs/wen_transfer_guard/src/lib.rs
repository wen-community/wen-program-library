pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod tools;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("4MrF8SuFtwGg53bL6KziCe7suvKqUoBg7o7Lnix1Ton5");

#[program]
pub mod wen_transfer_guard {
    use super::*;

    #[interface(spl_transfer_hook_interface::initialize_extra_account_meta_list)]
    pub fn initialize(
        ctx: Context<Initialize>,
        metas: Vec<AnchorExtraAccountMeta>,
        cpi_rule: Option<CPIRule>,
        transfer_amount_rule: Option<TransferAmountRule>,
        addition_fields_rule: Vec<MetadataAdditionalFieldRule>,
    ) -> Result<()> {
        initialize::processor(
            ctx,
            metas,
            cpi_rule,
            transfer_amount_rule,
            addition_fields_rule,
        )
    }

    #[interface(spl_transfer_hook_interface::execute)]
    pub fn execute(ctx: Context<Execute>, amount: u64) -> Result<()> {
        execute::processor(ctx, amount)
    }
}
