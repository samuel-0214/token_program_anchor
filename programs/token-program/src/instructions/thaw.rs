use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint,TokenAccount, Token, ThawAccount};

#[derive(Accounts)]
pub struct ThawTokenAccount<'info>{
    #[account(mut)]
    pub token_account : Account<'info,TokenAccount>,
    #[account(mut)]
    pub mint: Account<'info,Mint>,
    pub freeze_authority: Signer<'info>,
    pub token_program: Program<'info,Token>,
}

pub fn thaw_token_account(ctx: Context<ThawTokenAccount>) -> Result<()>{
    let cpi_accounts = ThawAccount{
        account : ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.freeze_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token::thaw_account(cpi_context);
    msg!(
        "Token account {} has been thawed by freeze authority {}",
        ctx.accounts.token_account.key(),
        ctx.accounts.freeze_authority.key()
    );
    Ok(())
}