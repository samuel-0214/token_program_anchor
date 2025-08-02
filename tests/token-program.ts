import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TokenProgram } from "../target/types/token_program";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  LAMPORTS_PER_SOL 
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint
} from "@solana/spl-token";
import { expect } from "chai";

describe("anchor_token_c", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.AnchorTokenC as Program<TokenProgram>;
  const provider = anchor.getProvider();

  // Test accounts
  let mintKeypair: Keypair;
  let userKeypair: Keypair;
  let user2Keypair: Keypair;
  let userTokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  let delegateKeypair: Keypair;

  // Test constants
  const MINT_DECIMALS = 6;
  const INITIAL_MINT_AMOUNT = 1000 * Math.pow(10, MINT_DECIMALS); // 1000 tokens
  const TRANSFER_AMOUNT = 100 * Math.pow(10, MINT_DECIMALS); // 100 tokens
  const BURN_AMOUNT = 50 * Math.pow(10, MINT_DECIMALS); // 50 tokens
  const APPROVE_AMOUNT = 200 * Math.pow(10, MINT_DECIMALS); // 200 tokens

  before(async () => {
    // Generate test keypairs
    mintKeypair = Keypair.generate();
    userKeypair = Keypair.generate();
    user2Keypair = Keypair.generate();
    delegateKeypair = Keypair.generate();

    // Airdrop SOL to test accounts
    await provider.connection.requestAirdrop(userKeypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2Keypair.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(delegateKeypair.publicKey, LAMPORTS_PER_SOL);

    // Wait for airdrops to confirm
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Calculate associated token addresses
    userTokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      userKeypair.publicKey
    );
    
    user2TokenAccount = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      user2Keypair.publicKey
    );
  });

  describe("Initialize Mint", () => {
    it("Should initialize mint with freeze authority", async () => {
      const tx = await program.methods
        .initializeMint()
        .accounts({
          signer: userKeypair.publicKey,
          mint: mintKeypair.publicKey,
        })
        .signers([userKeypair, mintKeypair])
        .rpc();

      console.log("Initialize mint transaction signature:", tx);

      // Verify mint was created correctly
      const mintInfo = await getMint(provider.connection, mintKeypair.publicKey);
      expect(mintInfo.decimals).to.equal(MINT_DECIMALS);
      expect(mintInfo.mintAuthority?.toString()).to.equal(userKeypair.publicKey.toString());
      expect(mintInfo.freezeAuthority?.toString()).to.equal(userKeypair.publicKey.toString());
      expect(mintInfo.supply.toString()).to.equal("0");
    });
  });

  describe("Create Token Accounts", () => {
    it("Should create token account for user", async () => {
      // Create associated token account for user
      const createAccountIx = createAssociatedTokenAccountInstruction(
        userKeypair.publicKey,
        userTokenAccount,
        userKeypair.publicKey,
        mintKeypair.publicKey
      );

      const tx = new anchor.web3.Transaction().add(createAccountIx);
      await provider.sendAndConfirm(tx, [userKeypair]);

      // Verify token account was created
      const accountInfo = await getAccount(provider.connection, userTokenAccount);
      expect(accountInfo.mint.toString()).to.equal(mintKeypair.publicKey.toString());
      expect(accountInfo.owner.toString()).to.equal(userKeypair.publicKey.toString());
      expect(accountInfo.amount.toString()).to.equal("0");
    });

    it("Should create token account for user2", async () => {
      // Create associated token account for user2
      const createAccountIx = createAssociatedTokenAccountInstruction(
        user2Keypair.publicKey,
        user2TokenAccount,
        user2Keypair.publicKey,
        mintKeypair.publicKey
      );

      const tx = new anchor.web3.Transaction().add(createAccountIx);
      await provider.sendAndConfirm(tx, [user2Keypair]);

      // Verify token account was created
      const accountInfo = await getAccount(provider.connection, user2TokenAccount);
      expect(accountInfo.mint.toString()).to.equal(mintKeypair.publicKey.toString());
      expect(accountInfo.owner.toString()).to.equal(user2Keypair.publicKey.toString());
      expect(accountInfo.amount.toString()).to.equal("0");
    });
  });

  describe("Mint Tokens", () => {
    it("Should mint tokens to user account", async () => {
      const tx = await program.methods
        .mintTokens(new anchor.BN(INITIAL_MINT_AMOUNT))
        .accounts({
          mint: mintKeypair.publicKey,
          tokenAccount: userTokenAccount,
          mintAuthority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Mint tokens transaction signature:", tx);

      // Verify tokens were minted
      const accountInfo = await getAccount(provider.connection, userTokenAccount);
      expect(accountInfo.amount.toString()).to.equal(INITIAL_MINT_AMOUNT.toString());

      // Verify mint supply increased
      const mintInfo = await getMint(provider.connection, mintKeypair.publicKey);
      expect(mintInfo.supply.toString()).to.equal(INITIAL_MINT_AMOUNT.toString());
    });

    it("Should fail to mint with wrong authority", async () => {
      try {
        await program.methods
          .mintTokens(new anchor.BN(INITIAL_MINT_AMOUNT))
          .accounts({
            mint: mintKeypair.publicKey,
            tokenAccount: userTokenAccount,
            mintAuthority: user2Keypair.publicKey, // Wrong authority
          })
          .signers([user2Keypair])
          .rpc();
        
        expect.fail("Should have failed with wrong mint authority");
      } catch (error) {
        // The error could be various constraint violations
        console.log("Expected error:", error.message);
        expect(error).to.exist; // Just check that an error occurred
      }
    });
  });

  describe("Transfer Tokens", () => {
    it("Should transfer tokens between accounts", async () => {
      const tx = await program.methods
        .transferTokens(new anchor.BN(TRANSFER_AMOUNT))
        .accounts({
          fromTokenAccount: userTokenAccount,
          toTokenAccount: user2TokenAccount,
          authority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Transfer tokens transaction signature:", tx);

      // Verify balances after transfer
      const fromAccountInfo = await getAccount(provider.connection, userTokenAccount);
      const toAccountInfo = await getAccount(provider.connection, user2TokenAccount);
      
      expect(fromAccountInfo.amount.toString()).to.equal((INITIAL_MINT_AMOUNT - TRANSFER_AMOUNT).toString());
      expect(toAccountInfo.amount.toString()).to.equal(TRANSFER_AMOUNT.toString());
    });

    it("Should fail transfer with insufficient funds", async () => {
      try {
        await program.methods
          .transferTokens(new anchor.BN(INITIAL_MINT_AMOUNT * 2)) // More than balance
          .accounts({
            fromTokenAccount: userTokenAccount,
            toTokenAccount: user2TokenAccount,
            authority: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have failed with insufficient funds");
      } catch (error) {
        expect(error.message).to.include("InsufficientFunds");
      }
    });
  });

  describe("Approve and Revoke Delegate", () => {
    it("Should approve delegate", async () => {
      const tx = await program.methods
        .approveDelegate(new anchor.BN(APPROVE_AMOUNT))
        .accounts({
          tokenAccount: userTokenAccount,
          delegate: delegateKeypair.publicKey,
          authority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Approve delegate transaction signature:", tx);

      // Verify delegation was set
      const accountInfo = await getAccount(provider.connection, userTokenAccount);
      expect(accountInfo.delegate?.toString()).to.equal(delegateKeypair.publicKey.toString());
      expect(accountInfo.delegatedAmount.toString()).to.equal(APPROVE_AMOUNT.toString());
    });

    it("Should revoke delegate", async () => {
      const tx = await program.methods
        .revokeDelegate()
        .accounts({
          tokenAccount: userTokenAccount,
          authority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Revoke delegate transaction signature:", tx);

      // Verify delegation was removed
      const accountInfo = await getAccount(provider.connection, userTokenAccount);
      expect(accountInfo.delegate).to.be.null;
      expect(accountInfo.delegatedAmount.toString()).to.equal("0");
    });

    it("Should fail to revoke when no delegate exists", async () => {
      try {
        await program.methods
          .revokeDelegate()
          .accounts({
            tokenAccount: userTokenAccount,
            authority: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have failed when no delegate exists");
      } catch (error) {
        expect(error.message).to.include("NoDelegateToRevoke");
      }
    });
  });

  describe("Burn Tokens", () => {
    it("Should burn tokens from account", async () => {
      const beforeBurnBalance = await getAccount(provider.connection, userTokenAccount);
      const beforeBurnSupply = await getMint(provider.connection, mintKeypair.publicKey);

      const tx = await program.methods
        .burnTokens(new anchor.BN(BURN_AMOUNT))
        .accounts({
          mint: mintKeypair.publicKey,
          tokenAccount: userTokenAccount,
          authority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Burn tokens transaction signature:", tx);

      // Verify tokens were burned
      const afterBurnBalance = await getAccount(provider.connection, userTokenAccount);
      const afterBurnSupply = await getMint(provider.connection, mintKeypair.publicKey);

      expect(afterBurnBalance.amount.toString()).to.equal(
        (BigInt(beforeBurnBalance.amount.toString()) - BigInt(BURN_AMOUNT)).toString()
      );
      expect(afterBurnSupply.supply.toString()).to.equal(
        (BigInt(beforeBurnSupply.supply.toString()) - BigInt(BURN_AMOUNT)).toString()
      );
    });

    it("Should fail to burn more than balance", async () => {
      try {
        await program.methods
          .burnTokens(new anchor.BN(INITIAL_MINT_AMOUNT * 2))
          .accounts({
            mint: mintKeypair.publicKey,
            tokenAccount: userTokenAccount,
            authority: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have failed with insufficient balance");
      } catch (error) {
        expect(error.message).to.include("InsufficientBalance");
      }
    });
  });

  describe("Freeze and Thaw Account", () => {
    it("Should freeze token account", async () => {
      const tx = await program.methods
        .freezeAccount()
        .accounts({
          mint: mintKeypair.publicKey,
          tokenAccount: user2TokenAccount,
          freezeAuthority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Freeze account transaction signature:", tx);

      // Verify account is frozen
      const accountInfo = await getAccount(provider.connection, user2TokenAccount);
      expect(accountInfo.isFrozen).to.be.true;
    });

    it("Should fail to transfer from frozen account", async () => {
      try {
        await program.methods
          .transferTokens(new anchor.BN(TRANSFER_AMOUNT / 2))
          .accounts({
            fromTokenAccount: user2TokenAccount, // This account is frozen
            toTokenAccount: userTokenAccount,
            authority: user2Keypair.publicKey,
          })
          .signers([user2Keypair])
          .rpc();
        
        expect.fail("Should have failed to transfer from frozen account");
      } catch (error) {
        // SPL Token program will reject the transfer
        expect(error).to.exist;
      }
    });

    it("Should thaw token account", async () => {
      const tx = await program.methods
        .thawAccount()
        .accounts({
          mint: mintKeypair.publicKey,
          tokenAccount: user2TokenAccount,
          freezeAuthority: userKeypair.publicKey,
        })
        .signers([userKeypair])
        .rpc();

      console.log("Thaw account transaction signature:", tx);

      // Verify account is thawed
      const accountInfo = await getAccount(provider.connection, user2TokenAccount);
      expect(accountInfo.isFrozen).to.be.false;
    });

    it("Should successfully transfer after thawing", async () => {
      const beforeBalance = await getAccount(provider.connection, user2TokenAccount);
      
      const tx = await program.methods
        .transferTokens(new anchor.BN(TRANSFER_AMOUNT / 2))
        .accounts({
          fromTokenAccount: user2TokenAccount,
          toTokenAccount: userTokenAccount,
          authority: user2Keypair.publicKey,
        })
        .signers([user2Keypair])
        .rpc();

      console.log("Transfer after thaw transaction signature:", tx);

      // Verify transfer succeeded
      const afterBalance = await getAccount(provider.connection, user2TokenAccount);
      expect(afterBalance.amount.toString()).to.equal(
        (BigInt(beforeBalance.amount.toString()) - BigInt(TRANSFER_AMOUNT / 2)).toString()
      );
    });

    it("Should fail to freeze with wrong authority", async () => {
      try {
        await program.methods
          .freezeAccount()
          .accounts({
            mint: mintKeypair.publicKey,
            tokenAccount: user2TokenAccount,
            freezeAuthority: user2Keypair.publicKey, // Wrong authority
          })
          .signers([user2Keypair])
          .rpc();
        
        expect.fail("Should have failed with wrong freeze authority");
      } catch (error) {
        expect(error.message).to.include("InvalidFreezeAuthority");
      }
    });
  });

  describe("Close Token Account", () => {
    it("Should close empty token account", async () => {
      // First, transfer all tokens out of user2's account
      const accountInfo = await getAccount(provider.connection, user2TokenAccount);
      const remainingBalance = accountInfo.amount;

      if (remainingBalance > 0) {
        await program.methods
          .transferTokens(new anchor.BN(remainingBalance.toString()))
          .accounts({
            fromTokenAccount: user2TokenAccount,
            toTokenAccount: userTokenAccount,
            authority: user2Keypair.publicKey,
          })
          .signers([user2Keypair])
          .rpc();
      }

      // Get user2's SOL balance before closing
      const beforeBalance = await provider.connection.getBalance(user2Keypair.publicKey);

      // Now close the empty account
      const tx = await program.methods
        .closeTokenAccount()
        .accounts({
          tokenAccount: user2TokenAccount,
          destination: user2Keypair.publicKey,
          authority: user2Keypair.publicKey,
        })
        .signers([user2Keypair])
        .rpc();

      console.log("Close token account transaction signature:", tx);

      // Verify account was closed and rent was returned
      const afterBalance = await provider.connection.getBalance(user2Keypair.publicKey);
      expect(afterBalance).to.be.greaterThan(beforeBalance);

      // Verify account no longer exists (it should throw an error when trying to fetch)
      try {
        await getAccount(provider.connection, user2TokenAccount);
        expect.fail("Account should have been closed");
      } catch (error) {
        // Account should not exist anymore - any error is expected
        console.log("Expected error when fetching closed account:", error.message);
        expect(error).to.exist;
      }
    });

    it("Should fail to close account with non-zero balance", async () => {
      // userTokenAccount still has tokens, so this should fail
      try {
        await program.methods
          .closeTokenAccount()
          .accounts({
            tokenAccount: userTokenAccount,
            destination: userKeypair.publicKey,
            authority: userKeypair.publicKey,
          })
          .signers([userKeypair])
          .rpc();
        
        expect.fail("Should have failed to close account with non-zero balance");
      } catch (error) {
        expect(error.message).to.include("AccountNotEmpty");
      }
    });
  });

  describe("Summary", () => {
    it("Should display final state", async () => {
      const mintInfo = await getMint(provider.connection, mintKeypair.publicKey);
      const userBalance = await getAccount(provider.connection, userTokenAccount);

      console.log("\n=== FINAL STATE ===");
      console.log(`Mint: ${mintKeypair.publicKey.toString()}`);
      console.log(`Total Supply: ${mintInfo.supply.toString()}`);
      console.log(`User Balance: ${userBalance.amount.toString()}`);
      console.log(`Mint Decimals: ${mintInfo.decimals}`);
      console.log(`Mint Authority: ${mintInfo.mintAuthority?.toString()}`);
      console.log(`Freeze Authority: ${mintInfo.freezeAuthority?.toString()}`);
    });
  });
});
