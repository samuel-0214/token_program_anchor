use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

#[derive(Accounts)]
pub struct InitializeMint<'info>{
    #[account(mut)]
    pub signer : Signer<'info>,

    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = signer.key(),
        mint::freeze_authority = signer.key(),
    )]
    pub mint : Account<'info,Mint>,

    pub token_program : Program<'info,Token>,
    pub system_program: Program<'info,System>,
}

pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()>{
    msg!("Created Mint Account {:?}",ctx.accounts.mint.key());
    Ok(())
}