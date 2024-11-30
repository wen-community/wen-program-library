import {
    ComputeBudgetProgram,
    PublicKey,
    SystemProgram,
    Transaction,
    SYSVAR_INSTRUCTIONS_PUBKEY,
  } from "@solana/web3.js";
  import {
      fetchMarketByAddress,
      fetchOrderByAddress,
    getAtaAddress,
    getEventAuthority,
    getProvider,
    getTokenProgramFromMint,
  } from "../utils";
  import {
    getProgramInstanceRaribleMarketplace,
    IExecutorParams,
    sendSignedTransaction,
  } from "@rarible_int/protocol-contracts-svm-core";
  import { CancelBidParams } from "../model";
  import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
  
  export const cancelBid = async ({
    wallet,
    params,
    connection,
  }: IExecutorParams<CancelBidParams>) => {
    const marketProgram = getProgramInstanceRaribleMarketplace(connection);

    const eventAuthority = getEventAuthority();
  
    const initializer = wallet.publicKey?.toString();
    if (!initializer) {
      return undefined;
    }
  
    const provider = getProvider(connection.rpcEndpoint);
  

    const order = await fetchOrderByAddress(provider, params.orderId);
    if (!order) {
      console.error("Order not found.");
      return undefined;
    }
  
    const nftMint = new PublicKey(order.nftMint);
  
    // Fetch market
    const market = await fetchMarketByAddress(provider, order.market.toString());
    if (!market) {
      console.error("Market not found.");
      return undefined;
    }
  
    const paymentTokenProgram = await getTokenProgramFromMint(provider, order.paymentMint.toBase58());

    const initializerPaymentTa = getAtaAddress(order.paymentMint.toBase58(), initializer, paymentTokenProgram.toString());
	const orderPaymentTa = getAtaAddress(order.paymentMint.toBase58(), params.orderId.toString(), paymentTokenProgram.toString());
  
    // Log all account addresses before creating the instruction
    console.log("Accounts used in the transaction:");
    console.log("Initializer (wallet):", wallet.publicKey.toBase58());
    console.log("Event Authority:", eventAuthority.toBase58());
    console.log("NFT Mint:", order.paymentMint.toBase58() ?? PublicKey.default.toBase58());
    console.log("Order Account:", params.orderId);
    console.log("Initializer Payment Token Account:", initializerPaymentTa.toBase58());
    console.log("Order Payment Token Account:", orderPaymentTa.toBase58());
    console.log("Payment Token Program:", paymentTokenProgram.toBase58());
    console.log("Associated Token Program ID:", ASSOCIATED_TOKEN_PROGRAM_ID.toBase58());
    console.log("System Program ID:", SystemProgram.programId.toBase58());
    console.log("Marketplace Program ID:", marketProgram.programId.toBase58());
    console.log("Payment Mint:", order.paymentMint);
    console.log("Program ID:", marketProgram.programId.toBase58());
    console.log("SYSVAR Instructions Pubkey:", SYSVAR_INSTRUCTIONS_PUBKEY.toBase58());
  
  
    const instruction = await marketProgram.methods
      .cancelBid()
      .accountsStrict({
        initializer: wallet.publicKey,
        market: order.market,
        order: params.orderId,
        initializerPaymentTa,
        orderPaymentTa,
        paymentTokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        program: marketProgram.programId,
        eventAuthority,
        paymentMint: order.paymentMint,
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
  
    return { tx, txid, order: params.orderId, market: market };
  };
  