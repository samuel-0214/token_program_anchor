use anchor_lang::prelude::*;
use anchor_spl::{token::{self,Mint, TokenAccount, Token, TransferChecked}};

#[derive(Accounts)]
pub struct TransferTokens<'info>{
    #[account(mut)]
    pub signer : Signer<'info>,
    #[account(mut)]
    pub mint: Account<'info,Mint>,
    #[account(mut)]
    pub sender_token_account: Account<'info,TokenAccount>,
    #[account(mut)]
    pub receiver_token_account: Account<'info,TokenAccount>,
    pub token_program: Program<'info,Token>
}

pub fn transfer_tokens(ctx:Context<TransferTokens>,amount:u64) -> Result<()>{

    let decimals = ctx.accounts.mint.decimals;

    let cpi_accounts = TransferChecked{
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.sender_token_account.to_account_info(),
        to: ctx.accounts.receiver_token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);

    token::transfer_checked(cpi_context,amount, decimals)?;
    Ok(())
}