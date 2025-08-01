use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct CreateTokenAccount<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        init,
        payer = signer,
        token::mint = mint, 
        token::authority = signer,
    )]
    pub token_account: InterfaceAccount<'info,TokenAccount>,
    pub mint : InterfaceAccount<'info,Mint>,
    pub token_program: Interface<'info,TokenInterface>,
    pub system_program: Program<'info,System>,
}

pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()>{
    msg!("Token account created successfully");
    Ok(())
}