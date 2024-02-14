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

// Purchase NFT
export interface PurchaseNftArgs {
    collection: string;
    nftMint: string;
    paymentLamports: number;
    buyer: string;
}

// Transfer NFT
export interface TransferNftArgs {
    nftMint: string;
    to: string;
}