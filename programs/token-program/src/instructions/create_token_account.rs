use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token};

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
    pub token_account: Account<'info,TokenAccount>,
    pub mint : Account<'info,Mint>,
    pub token_program: Program<'info,Token>,
    pub system_program: Program<'info,System>,
}

pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()>{
    msg!("Token account created successfully");
    Ok(())
}