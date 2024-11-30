import { WnsAccountParams } from "../utils";

export type InitMarketParams = {
	marketIdentifier: string;
	feeRecipient: string;
	feeBps: number;
};

export type ListParams = {
	marketIdentifier: string;
	nftMint: string | undefined;
	paymentMint: string;
	size: number;
	price: number;
	extraAccountParams: WnsAccountParams | undefined; // Add metaplex
};

export type BidParams = {
	marketIdentifier: string;
	nftMint: string | undefined;
	paymentMint: string;
	size: number;
	price: number;
	extraAccountParams: WnsAccountParams | undefined; // Add metaplex
};

export type CancelBidParams = {
	orderId: string;
};

export type FillOrderParams = {
    orderAddress: string;
    amountToFill: number;
    extraAccountParams: WnsAccountParams | undefined
}