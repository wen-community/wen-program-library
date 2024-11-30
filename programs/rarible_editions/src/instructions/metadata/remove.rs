use std::str::FromStr;

use anchor_lang::{prelude::*, solana_program::program::invoke};

use crate::utils::update_account_lamports_to_minimum_balance;
use crate::{errors::MetadataErrors, EditionsDeployment, ROYALTY_BASIS_POINTS_FIELD};
use anchor_spl::{
    token_interface::spl_token_metadata_interface::instruction::remove_key,
    token_interface::{Mint, Token2022},
};
use solana_program::program::invoke_signed;

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct RemoveMetadataArgs {
    pub field: String,
    pub value: String,
}

#[derive(Accounts)]
pub struct RemoveMetadata<'info> {
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
    pub mint: Box<InterfaceAccount<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token2022>,
}

impl<'info> RemoveMetadata<'info> {
    // ToDo: Create a macro for it
    fn remove_token_metadata_field(&self, field: String, bump_edition: u8) -> Result<()> {
        let deployment_seeds: &[&[u8]] = &[
            "editions_deployment".as_bytes(),
            self.editions_deployment.symbol.as_ref(),
            &[bump_edition],
        ];
        let signer_seeds: &[&[&[u8]]] = &[deployment_seeds];

        invoke_signed(
            &remove_key(
                &self.token_program.key(),
                &self.mint.key(),
                &self.editions_deployment.key(),
                field,
                false,
            ),
            &[
                self.mint.to_account_info(),
                self.editions_deployment.to_account_info(),
            ],
            signer_seeds,
        )?;

        Ok(())
    }
}

pub fn handler(ctx: Context<RemoveMetadata>, args: Vec<RemoveMetadataArgs>) -> Result<()> {
    for metadata_arg in args {
        // Validate that the field is not a public key
        if Pubkey::from_str(&metadata_arg.field).is_ok() {
            return Err(MetadataErrors::InvalidField.into());
        }

        // Validate that the field does not start with reserved prefixes
        if metadata_arg.field.starts_with(ROYALTY_BASIS_POINTS_FIELD) {
            return Err(MetadataErrors::InvalidField.into());
        }

        if metadata_arg.field.to_string() == ROYALTY_BASIS_POINTS_FIELD {
            continue;
        }
        // validate that the field is not a publickey
        match Pubkey::from_str(&metadata_arg.field) {
            Ok(_) => {
                return Err(MetadataErrors::InvalidField.into());
            }
            Err(_) => {
                ctx.accounts.remove_token_metadata_field(
                    metadata_arg.field,
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
