// Create collection
export interface CreateCollectionArgs {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
    maxSize: number;
}

/*
    INDIVIDUAL NFT
*/
// Create NFT
export interface CreateNftArgs {
    mint: string;
    name: string;
    symbol: string;
    uri: string;
}

// Add NFT to Group
export interface AddToGroupArgs {
    mint: string;
    group: string;
}

// Creator Details
export interface Creator {
    address: string;
    share: number;
}

export interface RoyaltyEnforcementArgs {
    royaltyBasisPoints: number;
    creators: Creator[];
}

// Transfer NFT
export interface TransferNftArgs {
    collection: string;
    nftMint: string;
    paymentMint: string;
    paymentAmount: number;
    to: string;
}