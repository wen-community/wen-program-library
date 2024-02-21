import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getATAAddressSync, getDistributionAccount, getDistributionProgram, getGroupAccount } from "./core";
import { Provider } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "./constants";

export const buildAddDistributionIx = async (provider: Provider, collection: string, authority: string) => {
    const distributionProgram = getDistributionProgram(provider);
    const distributionAccount = getDistributionAccount(collection);
    const groupAccount = getGroupAccount(collection);
    
    const authorityPubkey = new PublicKey(authority);

    const ix = await distributionProgram.methods
        .initializeDistribution()
        .accountsStrict({
            payer: authorityPubkey,
            authority: authorityPubkey,
            group: groupAccount,
            systemProgram: SystemProgram.programId,
            distribution: distributionAccount,
        })
        .instruction();

    return ix;
};

export const buildClaimDistributionIx = async (provider: Provider, collection: string, creator: string, mintToClaim: string) => {
    const distributionProgram = getDistributionProgram(provider);
    const distributionAccount = getDistributionAccount(collection);

    const creatorPubkey = new PublicKey(creator);
    const mintPubkey = new PublicKey(mintToClaim);

    let creatorTokenAccount = creatorPubkey;
    let programTokenAccount = distributionAccount;

    if (mintToClaim !== PublicKey.default.toString()) {
        creatorTokenAccount = getATAAddressSync({ mint: mintPubkey, owner: creatorPubkey });
        programTokenAccount = getATAAddressSync({ mint: mintPubkey, owner: distributionAccount });
    }

    const ix = await distributionProgram.methods
        .claimDistribution(mintPubkey)
        .accountsStrict({
            payer: creatorPubkey,
            creator: creatorPubkey,
            distribution: distributionAccount,
            payerAddress: creatorTokenAccount,
            distributionAddress: programTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();

    return ix;
};

