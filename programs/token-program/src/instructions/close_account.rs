use anchor_lang::prelude::*;
use anchor_spl::token::{self,TokenAccount,Token, CloseAccount};

#[derive(Accounts)]
pub struct CloseTokenAccount<'info>{
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(mut)]
    pub token_account: Account<'info,TokenAccount>,
    #[account(mut)]
    pub destination: UncheckedAccount<'info>,
    pub token_program: Program<'info,Token>
}

pub fn close_token_account(ctx:Context<CloseTokenAccount>) -> Result<()>{

    let cpi_accounts = CloseAccount{
        account: ctx.accounts.token_account.to_account_info(),
        destination: ctx.accounts.destination.to_account_info(),
        authority: ctx.accounts.authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);

    token::close_account(cpi_context)?;
    Ok(())
}