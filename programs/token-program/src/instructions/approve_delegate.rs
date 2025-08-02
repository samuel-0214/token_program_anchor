use anchor_lang::prelude::*;
use anchor_spl::token::{self, Approve, Token, TokenAccount};

#[derive(Accounts)]
pub struct ApproveDelegate<'info>{
    #[account(mut)]
    pub token_account : Account<'info,TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info,Token>,
    pub delegate : UncheckedAccount<'info>
}

pub fn approve_delegate(ctx:Context<ApproveDelegate>,amount:u64) -> Result<()>{
    
    let cpi_accounts = Approve{
        to:ctx.accounts.token_account.to_account_info(),
        delegate:ctx.accounts.delegate.to_account_info(),
        authority:ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token::approve(cpi_context, amount)?;
    msg!(
        "Approved delegate {} to transfer up to {} tokens",
        ctx.accounts.delegate.key(),
        amount
    );
    Ok(())
}