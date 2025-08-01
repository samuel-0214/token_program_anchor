use anchor_lang::prelude::*;
use anchor_spl::{
    token_interface::{self,Mint,MintTo,TokenAccount,TokenInterface},
};

#[derive(Accounts)]
pub struct MintTokens<'info>{
    #[account(mut)]
    pub signer : Signer<'info>,
    #[account(mut)]
    pub mint: InterfaceAccount<'info,Mint>,
    #[account(mut, constraint = token_account.mint == mint.key() @ MintError::InvalidTokenAccount)]
    pub token_account: InterfaceAccount<'info,TokenAccount>,
    pub token_program: Interface<'info,TokenInterface>
}

pub fn mint_tokens(ctx: Context<MintTokens>, amount:u64) -> Result<()>{

    require_keys_eq!(
        ctx.accounts.mint.mint_authority.unwrap(),
        ctx.accounts.signer.key(),
        MintError::InvalidMintAuthority
    );

    let cpi_accounts = MintTo{
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program,cpi_accounts);
    token_interface::mint_to(cpi_context,amount)?;
    Ok(())
}

#[error_code]
pub enum MintError{
    #[msg("Invalid Token Account")]
    InvalidTokenAccount,
    #[msg("The signer is not the mint authority")]
    InvalidMintAuthority
}