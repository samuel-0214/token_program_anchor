use anchor_lang::prelude::*;
pub mod instructions;
pub use instructions::*;


declare_id!("F43uCeWZDwSFY91uHQ6YCw4D9P1sgX3sndAqRyGd5g18");

#[program]
pub mod token_program {
    use super::*;

    pub fn initialization(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn initialize_mint(ctx: Context<InitializeMint>) -> Result<()>{
        instructions::initialize_mint(ctx)
    }

    pub fn create_token_account(ctx: Context<CreateTokenAccount>) -> Result<()>{
        instructions::create_token_account(ctx)
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount:u64) -> Result<()>{
        instructions::mint_tokens(ctx, amount)
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>,amount:u64) -> Result<()>{
        instructions::transfer_tokens(ctx, amount)
    }

    pub fn burn_tokens(ctx: Context<BurnTokens>, amount:u64) -> Result<()>{
        instructions::burn_tokens(ctx, amount)
    }

    pub fn freeze_token_account(ctx: Context<FreezeTokenAccount>) -> Result<()>{
        instructions::freeze(ctx)
    }

    pub fn thaw_token_account(ctx: Context<ThawTokenAccount>) -> Result<()>{
        instructions::thaw_token_account(ctx)
    }

}
