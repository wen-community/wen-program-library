import { Provider } from "@coral-xyz/anchor";
import { getATAAddressSync, getExtraMetasAccount, getGroupAccount, getManagerAccount, getMemberAccount, getMetadataProgram } from "./core";
import { CreateNftArgs, Creator } from "./interfaces";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "./constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";

export const buildMintNftIx = async (provider: Provider, args: CreateNftArgs, minter: string, authority: string) => {
    const metadataProgram = getMetadataProgram(provider);

    const mintPubkey = new PublicKey(args.mint);
    const managerAccount = getManagerAccount();
    const authorityPubkey = new PublicKey(authority);
    const minterPubkey = new PublicKey(minter);
    const extraMetasAccount = getExtraMetasAccount(args.mint);

    const ix = await metadataProgram.methods
        .createMintAccount(args)
        .accountsStrict({
            payer: minterPubkey,
            authority: authorityPubkey,
            receiver: minterPubkey,
            mint: mintPubkey,
            mintTokenAccount: getATAAddressSync({ mint: mintPubkey, owner: minterPubkey }),
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            manager: managerAccount,
            extraMetasAccount,
        })
        .instruction();
    return ix;
};

export const buildAddGroupIx = async (provider: Provider, collectionAuthority: string, mint: string, collectionMint: string) => {
    const metadataProgram = getMetadataProgram(provider);

    const groupAccount = getGroupAccount(collectionMint);
    const memberAccount = getMemberAccount(mint);
    const collectionAuthPubkey = new PublicKey(collectionAuthority);
    const mintPubkey = new PublicKey(mint);

    const ix = await metadataProgram.methods
        .addGroupToMint()
        .accountsStrict({
            payer: collectionAuthPubkey,
            authority: collectionAuthPubkey,
            mint: mintPubkey,
            systemProgram: SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            group: groupAccount,
            member: memberAccount
        })
        .instruction();

    return ix;
}

export const buildAddRoyaltiesIx = async (provider: Provider, metadataAuthority: string, mint: string, royaltyBasisPoints: number, creators: Creator[]) => {
    const metadataProgram = getMetadataProgram(provider);

    const extraMetasAccount = getExtraMetasAccount(mint);
    const metadataAuthPubkey = new PublicKey(metadataAuthority);
    const mintPubkey = new PublicKey(mint);

    const ix = await metadataProgram.methods
        .addRoyaltiesToMint({
            royaltyBasisPoints,
            creators
        })
        .accountsStrict({
            payer: metadataAuthPubkey,
            authority: metadataAuthPubkey,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            extraMetasAccount,
            mint: mintPubkey,
        })
        .instruction();

    return ix;
}
