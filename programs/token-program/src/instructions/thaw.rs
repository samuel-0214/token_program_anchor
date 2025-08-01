use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint,TokenAccount, TokenInterface};
use anchor_spl::token_2022::{ThawAccount};

#[derive(Accounts)]
pub struct ThawTokenAccount<'info>{
    #[account(mut)]
    pub token_account : InterfaceAccount<'info,TokenAccount>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info,Mint>,
    pub freeze_authority: Signer<'info>,
    pub token_program: Interface<'info,TokenInterface>,
}

pub fn thaw_token_account(ctx: Context<ThawTokenAccount>) -> Result<()>{
    let cpi_accounts = ThawAccount{
        account : ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.freeze_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();

    let cpi_context = CpiContext::new(cpi_program, cpi_accounts);

    token_interface::thaw_account(cpi_context);
    msg!("Account has been thawed");
    Ok(())
}