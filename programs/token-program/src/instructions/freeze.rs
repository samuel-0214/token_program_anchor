use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self,TokenAccount,TokenInterface,Mint};
use anchor_spl::token_2022::{FreezeAccount};

#[derive(Accounts)]
pub struct FreezeTokenAccount<'info>{
    #[account(mut)]
    pub token_account: InterfaceAccount<'info,TokenAccount>,
    pub freeze_authority: Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info,Mint>,
    pub token_program: Interface<'info,TokenInterface>
}

pub fn freeze(ctx:Context<FreezeTokenAccount>) -> Result<()>{
    let cpi_accounts = FreezeAccount{
        account: ctx.accounts.token_account.to_account_info(),
        mint: ctx.accounts.mint.to_account_info(),
        authority: ctx.accounts.freeze_authority.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);

    token_interface::freeze_account(cpi_context)?;
    msg!("Token account frozen.");
    Ok(())
}