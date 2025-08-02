use anchor_lang::prelude::*;
use anchor_spl::token::{self, FreezeAccount, Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct FreezeTokenAccount<'info>{
    #[account(mut)]
    pub token_account: Account<'info,TokenAccount>,
    pub freeze_authority: Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info,Mint>,
    pub token_program: Program<'info,Token>
}

pub fn freeze(ctx:Context<FreezeTokenAccount>) -> Result<()>{
    let cpi_accounts = FreezeAccount{
        account: ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.freeze_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);

    token::freeze_account(cpi_context)?;
    msg!("Token account frozen.");
    Ok(())
}