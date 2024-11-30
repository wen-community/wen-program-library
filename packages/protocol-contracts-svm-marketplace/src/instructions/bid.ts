import {
    ComputeBudgetProgram,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    SYSVAR_INSTRUCTIONS_PUBKEY,
  } from "@solana/web3.js";
  import { type Provider, BN } from "@coral-xyz/anchor";
  import {
    getAtaAddress,
    getEventAuthority,
    getMarketPda,
    getOrderAccount,
    getProvider,
    getTokenProgramFromMint,
  } from "../utils";
  import {
    getProgramInstanceRaribleMarketplace,
    IExecutorParams,
    sendSignedTransaction,
  } from "@rarible_int/protocol-contracts-svm-core";
  import { BidParams } from "../model";
  import { PROGRAM_ID_MARKETPLACE } from "@rarible_int/protocol-contracts-svm-core";
  import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
  
  export const bid = async ({
    wallet,
    params,
    connection,
  }: IExecutorParams<BidParams>) => {
    const marketProgram = getProgramInstanceRaribleMarketplace(connection);
    const market = getMarketPda(params.marketIdentifier);
    const eventAuthority = getEventAuthority();
  
    const initializer = wallet.publicKey?.toString();
    if (!initializer) {
      return undefined;
    }
  
    const provider = getProvider(connection.rpcEndpoint);
  
    const paymentTokenProgram = await getTokenProgramFromMint(
      provider,
      params.paymentMint.toString()
    );
    if (!paymentTokenProgram) {
      return undefined;
    }
  
    const nonceKp = Keypair.generate();
    const nonce = nonceKp.publicKey;
  
    const order = getOrderAccount(
      nonce.toString(),
      market.toString(),
      initializer
    );

    const initializerPaymentTa = getAtaAddress(params.paymentMint, initializer, paymentTokenProgram.toString());
	const orderPaymentTa = getAtaAddress(params.paymentMint, order.toString(), paymentTokenProgram.toString());
  
    // Log all account addresses before creating the instruction
    console.log("Accounts used in the transaction:");
    console.log("Initializer (wallet):", wallet.publicKey.toBase58());
    console.log("Market PDA:", market.toBase58());
    console.log("Event Authority:", eventAuthority.toBase58());
    console.log("NFT Mint:", params.nftMint ?? PublicKey.default.toBase58());
    console.log("Order Account:", order.toBase58());
    console.log("Initializer Payment Token Account:", initializerPaymentTa.toBase58());
    console.log("Order Payment Token Account:", orderPaymentTa.toBase58());
    console.log("Payment Token Program:", paymentTokenProgram.toBase58());
    console.log("Associated Token Program ID:", ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    console.log("System Program ID:", SystemProgram.programId.toBase58());
    console.log("Marketplace Program ID:", marketProgram.programId.toBase58());
    console.log("Payment Mint:", params.paymentMint);
    console.log("Program ID:", marketProgram.programId.toBase58());
    console.log("SYSVAR Instructions Pubkey:", SYSVAR_INSTRUCTIONS_PUBKEY.toBase58());
  
    console.log("Parameters:");
    console.log("Nonce:", nonce.toBase58());
    console.log("Price:", params.price.toString());
    console.log("Size:", params.size.toString());
  
    const instruction = await marketProgram.methods
      .bid({
        nonce,
        price: new BN(params.price),
        size: new BN(params.size),
      })
      .accountsStrict({
        initializer: wallet.publicKey,
        market,
        nftMint: params.nftMint ?? PublicKey.default,
        order,
        initializerPaymentTa,
        orderPaymentTa,
        paymentTokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        program: marketProgram.programId,
        eventAuthority,
        paymentMint: params.paymentMint,
      })
      .instruction();
  
    // Create the transaction and add the instruction
    const instructions = [];
  
    // Add compute budget instruction
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: 850_000,
      })
    );
  
    instructions.push(instruction);
  
    const tx = new Transaction().add(...instructions);
  
    // Set recent blockhash and fee payer
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer = wallet.publicKey;
  
    // Sign and send the transaction
    await wallet.signTransaction(tx);
  
    const txid = await sendSignedTransaction({
      signedTransaction: tx,
      connection,
      skipPreflight: false,
    });
  
    return { tx, txid, order, market: market };
  };
  