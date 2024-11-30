use crate::ROYALTY_BASIS_POINTS_FIELD;
use anchor_lang::{prelude::*, solana_program::entrypoint::ProgramResult};
use std::str::FromStr;

use anchor_spl::token_interface::{
    spl_token_metadata_interface::state::Field, token_metadata_update_field, Token2022,
    TokenMetadataUpdateField,
};

use crate::utils::update_account_lamports_to_minimum_balance;
use crate::{errors::MetadataErrors, EditionsDeployment};

#[derive(Clone, AnchorDeserialize, AnchorSerialize)]
pub struct AddMetadataArgs {
    pub field: String,
    pub value: String,
}

#[derive(Accounts)]
pub struct AddMetadata<'info> {
    #[account(mut,
        seeds = ["editions_deployment".as_ref(), editions_deployment.symbol.as_ref()], bump)]
    pub editions_deployment: Account<'info, EditionsDeployment>,
    #[account(mut)]
    pub payer: Signer<'info>,

    // when deployment.require_creator_cosign is true, this must be equal to the creator
    // of the deployment otherwise, can be any signer account
    #[account(mut,
        constraint = signer.key() == editions_deployment.creator
    )]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub mint: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> AddMetadata<'info> {
    fn update_token_metadata_field(
        &self,
        field: Field,
        value: String,
        bump_edition: u8,
    ) -> ProgramResult {
        let deployment_seeds: &[&[u8]] = &[
            "editions_deployment".as_bytes(),
            self.editions_deployment.symbol.as_ref(),
            &[bump_edition],
        ];
        let signer_seeds: &[&[&[u8]]] = &[deployment_seeds];
        let cpi_accounts = TokenMetadataUpdateField {
            token_program_id: self.token_program.to_account_info(),
            metadata: self.mint.to_account_info(),
            update_authority: self.editions_deployment.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        token_metadata_update_field(cpi_ctx, field, value)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<AddMetadata>, args: Vec<AddMetadataArgs>) -> Result<()> {
    for metadata_arg in args {
        // Validate that the field is not a public key
        if Pubkey::from_str(&metadata_arg.field).is_ok() {
            return Err(MetadataErrors::InvalidField.into());
        }

        // Validate that the field does not start with reserved prefixes
        if metadata_arg.field.starts_with(ROYALTY_BASIS_POINTS_FIELD) {
            return Err(MetadataErrors::InvalidField.into());
        }

        // validate that the field is not a publickey
        match Pubkey::from_str(&metadata_arg.field) {
            Ok(_) => {
                return Err(MetadataErrors::InvalidField.into());
            }
            Err(_) => {
                ctx.accounts.update_token_metadata_field(
                    Field::Key(metadata_arg.field),
                    metadata_arg.value.to_string(),
                    ctx.bumps.editions_deployment,
                )?;
            }
        }
    }

    // transfer minimum rent to mint account
    update_account_lamports_to_minimum_balance(
        ctx.accounts.mint.to_account_info(),
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
    )?;

    Ok(())
}
