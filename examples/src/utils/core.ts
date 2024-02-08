import { AnchorProvider, Idl, Program, Provider, utils } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { DISTRIBUTION_PROGRAM_ID, WNS_PROGRAM_ID, TOKEN_PROGRAM_ID } from "./constants";
import { ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token";
import {
    distributionIdl,
    metadataIdl,
    WenRoyaltyDistribution,
    WenNewStandard
} from "../programs";

export const getProvider = (connectionUrl: string) => {
    const connection = new Connection(connectionUrl);
    const anchorProvider = AnchorProvider.env();
    const provider = new AnchorProvider(connection, anchorProvider.wallet, AnchorProvider.defaultOptions());
    
    return provider;
}

export const getMetadataProgram = (provider: Provider) => {
    return new Program(
        metadataIdl as Idl,
        WNS_PROGRAM_ID,
        provider
    ) as unknown as Program<WenNewStandard>;
}

export const getDistributionProgram = (provider: Provider) => {
    return new Program(
        distributionIdl as Idl,
        DISTRIBUTION_PROGRAM_ID,
        provider
    ) as unknown as Program<WenRoyaltyDistribution>;
}

export const getProgramAddress = (seeds: Array<Buffer | Uint8Array>, programId: PublicKey) => {
    const [key] = PublicKey.findProgramAddressSync(seeds, programId);
    return key;
};

export const getATAAddressSync = ({ mint, owner }: { mint: PublicKey; owner: PublicKey }): PublicKey => {
    return getProgramAddress(
        [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
    );
};

export const getGroupAccount = (mint: string) => {
    const [groupAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode("group"), new PublicKey(mint).toBuffer()], WNS_PROGRAM_ID);

    return groupAccount;
}

export const getMemberAccount = (mint: string) => {
    const [groupAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode("member"), new PublicKey(mint).toBuffer()], WNS_PROGRAM_ID);

    return groupAccount;
}

export const getApprovalAccount = (mint: string) => {
    const [approvalAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode("approve-account"), new PublicKey(mint).toBuffer()], WNS_PROGRAM_ID);

    return approvalAccount;
}

export const getExtraMetasAccount = (mint: string) => {
    const [extraMetasAccount] = PublicKey.findProgramAddressSync([utils.bytes.utf8.encode("extra-account-metas"), new PublicKey(mint).toBuffer()], WNS_PROGRAM_ID);

    return extraMetasAccount;
}

export const getDistributionAccount = (collection: string) => {
    const [distributionAccount] = PublicKey.findProgramAddressSync([new PublicKey(collection).toBuffer()], DISTRIBUTION_PROGRAM_ID);

    return distributionAccount;
}
