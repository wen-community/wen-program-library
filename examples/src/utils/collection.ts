import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "./constants";
import { getATAAddressSync, getGroupAccount, getManagerAccount, getMetadataProgram } from "./core";
import { CreateCollectionArgs } from "./interfaces";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { Provider } from "@coral-xyz/anchor";

export const buildCreateCollectionIx = async (provider: Provider, args: CreateCollectionArgs, authority: string) => {
    const metadataProgram = getMetadataProgram(provider);
    const groupAccount = getGroupAccount(args.mint);
    const managerAccount = getManagerAccount();

    const authorityPubkey = new PublicKey(authority);
    const mintPubkey = new PublicKey(args.mint);

    const ix = await metadataProgram.methods
        .createGroupAccount({
            name: args.name,
            symbol: args.symbol,
            uri: args.uri,
            maxSize: args.maxSize
        })
        .accountsStrict({
            payer: authorityPubkey,
            authority: authorityPubkey,
            receiver: authorityPubkey,
            mint: mintPubkey,
            mintTokenAccount: getATAAddressSync({ mint: mintPubkey, owner: authorityPubkey }),
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenProgram: TOKEN_PROGRAM_ID,
            group: groupAccount,
            manager: managerAccount
        })
        .instruction();

    return {
        ix,
        group: groupAccount
    };
};




