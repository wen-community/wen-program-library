use anchor_lang::prelude::*;

declare_id!("7EhFwHKHPF4ffuFtsh1929XfsnbHKaA5QNbouX5PYpSj");

#[program]
pub mod test_sale {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
