use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self,Burn,TokenAccount,TokenInterface,Mint};

#[derive(Accounts)]
pub struct BurnTokens<'info>{
    #[account(mut)]
    pub token_account: InterfaceAccount<'info,TokenAccount>,
    #[account(mut)]
    pub signer : Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info,Mint>,
    pub token_program: Interface<'info,TokenInterface>,
}

pub fn burn_tokens(ctx:Context<BurnTokens>,amount:u64)->Result<()>{

    let cpi_accounts = Burn{
        mint: ctx.accounts.mint.to_account_info(),
        from: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);
    token_interface::burn(cpi_context,amount)?;

     msg!("Burned {} tokens successfully! Total supply reduced.", amount);
    Ok(())
}