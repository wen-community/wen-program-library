import { Keypair, PublicKey, TransactionMessage, VersionedTransaction } from "@solana/web3.js";
import { CreateCollectionArgs, CreateNftArgs, Creator, TransferNftArgs } from "./utils/interfaces";
import { USER_ACCOUNT, buildCreateCollectionIx, getProvider, CONNECTION_URL, AUTHORITY_ACCOUNT, buildAddDistributionIx, buildMintNftIx, buildAddGroupIx, buildAddRoyaltiesIx, buildApproveIx, buildAtaCreateIx, buildTransferIx, buildClaimDistributionIx } from "./utils";

export const createCollectionWithRoyalties = async (args: { name: string; symbol: string; uri: string; maxSize: number; }) => {
    const collectionMint = new Keypair();
    const collectionPubkey = collectionMint.publicKey;
    const provider = getProvider(CONNECTION_URL);

    const authority = AUTHORITY_ACCOUNT;
    const authorityPubkey = authority.publicKey;

    const collectionArgs: CreateCollectionArgs = {
        name: args.name,
        symbol: args.symbol,
        uri: args.uri,
        maxSize: args.maxSize,
        mint: collectionPubkey.toString()
    }

    const { ix: createCollectionIx, group } = await buildCreateCollectionIx(provider, collectionArgs, authorityPubkey.toString());
    const addDistributionIx = await buildAddDistributionIx(provider, collectionPubkey.toString(), authorityPubkey.toString());

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: authorityPubkey,
        recentBlockhash: blockhash,
        instructions: [ createCollectionIx, addDistributionIx ],
      }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([authority, collectionMint]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig,
        group,
        collection: collectionMint.publicKey.toString()
    };
}


export const mintNft = async (args: { name: string; symbol: string; uri: string; collection: string; royaltyBasisPoints: number; creators: Creator[] }) => {
    const mint = new Keypair();
    const mintPubkey = mint.publicKey;
    const provider = getProvider(CONNECTION_URL);
    const collectionPubkey = new PublicKey(args.collection);

    const minter = USER_ACCOUNT;
    const minterPubkey = minter.publicKey;
    
    const groupAuthority = AUTHORITY_ACCOUNT;
    const groupAuthPubkey = groupAuthority.publicKey;

    // Doesn't have to be the same, usually will be
    const nftAuthority = AUTHORITY_ACCOUNT;
    const nftAuthPubkey = nftAuthority.publicKey;

    const mintDetails: CreateNftArgs = {
        name: args.name,
        symbol: args.symbol,
        uri: args.uri,
        mint: mintPubkey.toString()
    }

    const mintIx = await buildMintNftIx(provider, mintDetails, minterPubkey.toString(), nftAuthPubkey.toString());
    const addToGroupIx = await buildAddGroupIx(provider, groupAuthPubkey.toString(), mintPubkey.toString(), collectionPubkey.toString());
    const addRoyaltiesToMintIx = await buildAddRoyaltiesIx(provider, nftAuthPubkey.toString(), mintPubkey.toString(), args.royaltyBasisPoints, args.creators);

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: minterPubkey,
        recentBlockhash: blockhash,
        instructions: [ mintIx, addToGroupIx, addRoyaltiesToMintIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([minter, groupAuthority, nftAuthority, mint]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig,
        mint: mintPubkey.toString()
    }
}

export const transferMint = async (args: TransferNftArgs) => {
    const provider = getProvider(CONNECTION_URL);
    const paymentAmount = args.paymentAmount;

    // Only supporting SOL to start
    // const paymentMint = args.paymentMint;
    const paymentMint = "11111111111111111111111111111111";

    const nftMint = args.nftMint;
    const collection = args.collection;
    // Assume keypair from ENV, should change to better way to determine signer
    const sender = USER_ACCOUNT.publicKey.toString();

    const destination = args.to;

    const approveIx = await buildApproveIx(provider, sender, nftMint, collection, paymentAmount, paymentMint);
    const createAtaIx = await buildAtaCreateIx(sender, nftMint, destination);
    const transferIx = await buildTransferIx(provider, nftMint, sender, destination);

    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: new PublicKey(sender),
        recentBlockhash: blockhash,
        instructions: [ approveIx, createAtaIx, transferIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([USER_ACCOUNT]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig
    };
};

export const claimDistribution = async (args: { collection: string, mintToClaim: string }) => {
    const provider = getProvider(CONNECTION_URL);
    // In test, for now making Creator into auth account
    const creatorPubkey = AUTHORITY_ACCOUNT.publicKey;

    const claimIx = await buildClaimDistributionIx(provider, args.collection, creatorPubkey.toString(), args.mintToClaim);
    
    let blockhash = await provider.connection
        .getLatestBlockhash()
        .then(res => res.blockhash);
    const messageV0 = new TransactionMessage({
        payerKey: creatorPubkey,
        recentBlockhash: blockhash,
        instructions: [ claimIx ],
    }).compileToV0Message();
    const txn = new VersionedTransaction(messageV0);

    txn.sign([AUTHORITY_ACCOUNT]);
    const sig = await provider.connection.sendTransaction(txn);

    return {
        txn: sig
    };
};