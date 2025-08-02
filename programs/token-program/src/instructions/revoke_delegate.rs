use anchor_lang::prelude::*;
use anchor_spl::token::{self, Revoke, Token, TokenAccount};

#[derive(Accounts)]
pub struct RevokeDelegate<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub token_account: Account<'info,TokenAccount>,
    pub token_program: Program<'info,Token>
}

pub fn revoke_delegate(ctx:Context<RevokeDelegate>) -> Result<()>{

    let cpi_accounts = Revoke{
        source:ctx.accounts.token_account.to_account_info(),
        authority:ctx.accounts.authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token::revoke(cpi_context)?;
    Ok(())
}