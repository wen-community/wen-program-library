/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {type Provider, BN} from '@coral-xyz/anchor';
import {ASSOCIATED_TOKEN_PROGRAM_ID, createWrappedNativeAccount} from '@solana/spl-token';
import {
	SYSVAR_INSTRUCTIONS_PUBKEY, SystemProgram, PublicKey,
	Keypair,
	type AccountMeta,
} from '@solana/web3.js';
import {
	getMarketplaceProgram, getMarketPda, getOrderAccount, getVerificationPda, getEventAuthority, marketplaceProgramId, fetchOrderByAddress, getTokenProgramFromMint, getNftProgramFromMint, getAtaAddress,
	getRemainingAccountsForMint,
	type WnsAccountParams,
	fetchMarketByAddress,
	getFeeAccountsFromMarket,
} from '../utils';

export type CreateOrderArgs = {
	marketIdentifier: string;
	nftMint: string | undefined;
	paymentMint: string;
	size: number;
	price: number;
	extraAccountParams: WnsAccountParams | undefined; // Add metaplex
};
// List NFT
export const getListNft = async (provider: Provider, listingArgs: CreateOrderArgs) => {
	const marketProgram = getMarketplaceProgram(provider);
	const market = getMarketPda(listingArgs.marketIdentifier);
	const initializer = provider.publicKey?.toString();
	if (!initializer) {
		return undefined;
	}

	const nftMint = listingArgs.nftMint;
	if (!nftMint) return undefined;

	const nftTokenProgram = await getTokenProgramFromMint(provider, nftMint);
	if (!nftTokenProgram) {
		return undefined;
	}

	const nonceKp = Keypair.generate();
	const nonce = nonceKp.publicKey;

	const nftProgram = await getNftProgramFromMint(provider, nftMint);

	const order = getOrderAccount(nonce.toString(), market.toString(), initializer);
	const initializerNftTa = getAtaAddress(nftMint, initializer, nftTokenProgram.toString());

	// const verification = getVerificationPda(market.toString(), nftMint);
	const eventAuthority = getEventAuthority();

	const remainingAccounts: AccountMeta[] = await getRemainingAccountsForMint(provider, nftMint, listingArgs.extraAccountParams);

	
	const ix = await marketProgram.methods
		.list({
			nonce,
			paymentMint: new PublicKey(listingArgs.paymentMint),
			price: new BN(listingArgs.price),
			size: new BN(listingArgs.size)
		})
		.accountsStrict({
			initializer: provider.publicKey,
			market,
			nftMint,
			order,
			initializerNftTa,
			nftProgram: nftProgram ?? PublicKey.default,
			nftTokenProgram,
			sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
		})
		.remainingAccounts(remainingAccounts)
		.instruction();

	return ix;
};

export const getBid = async (provider: Provider, biddingArgs: CreateOrderArgs) => {
	const marketProgram = getMarketplaceProgram(provider);
	const market = getMarketPda(biddingArgs.marketIdentifier);
	const initializer = provider.publicKey?.toString();
	if (!initializer) {
		return undefined;
	}

	const paymentTokenProgram = await getTokenProgramFromMint(provider, biddingArgs.paymentMint.toString());
	if (!paymentTokenProgram) {
		return undefined;
	}

	const nonceKp = Keypair.generate();
	const nonce = nonceKp.publicKey;

	const order = getOrderAccount(nonce.toString(), market.toString(), initializer);
	const initializerPaymentTa = getAtaAddress(biddingArgs.paymentMint, initializer, paymentTokenProgram.toString());
	const orderPaymentTa = getAtaAddress(biddingArgs.paymentMint, order.toString(), paymentTokenProgram.toString());

	const eventAuthority = getEventAuthority();

	const ix = await marketProgram.methods
		.bid({
			nonce,
			price: new BN(biddingArgs.price),
			size: new BN(biddingArgs.size),
		})
		.accountsStrict({
			initializer: provider.publicKey,
			market,
			nftMint: biddingArgs.nftMint ?? PublicKey.default,
			order,
			initializerPaymentTa,
			orderPaymentTa,
			paymentTokenProgram,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
			paymentMint: biddingArgs.paymentMint,
		})
		.instruction();

	return ix;
};

export const fillOrder = async (provider: Provider, orderAddress: string, amountToFill: number, nftMint: string, extraAccountParams: WnsAccountParams | undefined) => {
	const marketProgram = getMarketplaceProgram(provider);

	const initializer = provider.publicKey?.toString();
	if (!initializer) {
		return undefined;
	}

	const order = await fetchOrderByAddress(provider, orderAddress);
	if (!order) {
		return undefined;
	}

	const market = await fetchMarketByAddress(provider, order.market.toString());
	if (!market) {
		return undefined;
	}

	const nftTokenProgram = await getTokenProgramFromMint(provider, nftMint);
	const paymentTokenProgram = await getTokenProgramFromMint(provider, order.paymentMint.toString());
	if (!paymentTokenProgram || !nftTokenProgram) {
		return undefined;
	}

	const nftProgram = await getNftProgramFromMint(provider, nftMint);

	const isBuy = order.side === 0;

	const nftRecipient = isBuy ? order.owner.toString() : initializer;
	const nftFunder = isBuy ? initializer : order.owner.toString();
	const paymentFunder = isBuy ? orderAddress : initializer.toString();
	const paymentRecipient = isBuy ? initializer : order.owner.toString();

	const buyerPaymentTa = getAtaAddress(order.paymentMint.toString(), paymentFunder, paymentTokenProgram.toString());
	const sellerPaymentTa = getAtaAddress(order.paymentMint.toString(), paymentRecipient, paymentTokenProgram.toString());
	const buyerNftTa = getAtaAddress(nftMint, nftRecipient, nftTokenProgram.toString());
	const sellerNftTa = getAtaAddress(nftMint, nftFunder, nftTokenProgram.toString());

	const eventAuthority = getEventAuthority();

	const feeRemAccs = getFeeAccountsFromMarket(order.paymentMint, paymentTokenProgram, market);

	console.log({ feeRemAccs });
	const baseRemainingAccounts: AccountMeta[] = await getRemainingAccountsForMint(provider, nftMint, extraAccountParams);
	const remainingAccounts = [...feeRemAccs, ...baseRemainingAccounts];

	const ix = await marketProgram.methods
		.fillOrder(new BN(amountToFill))
		.accountsStrict({
			taker: provider.publicKey,
			maker: order.owner,
			market: order.market,
			order: orderAddress,
			buyerNftTa,
			buyerPaymentTa,
			sellerNftTa,
			sellerPaymentTa,
			nftTokenProgram,
			paymentTokenProgram,
			nftProgram: nftProgram ?? PublicKey.default,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
			paymentMint: order.paymentMint,
			nftMint,
			sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY
		})
		.remainingAccounts(remainingAccounts)
		.instruction();

	return ix;
};

// Cancel Listing
export const getCancelListing = async (provider: Provider, orderAddress: PublicKey, extraAccountParams: WnsAccountParams | undefined) => {
	const marketProgram = getMarketplaceProgram(provider);
	const initializer = provider.publicKey?.toString();
	if (!initializer) {
		return undefined;
	}

	const order = await fetchOrderByAddress(provider, orderAddress.toString());
	if (!order) {
		return undefined;
	}

	const {nftMint} = order;

	const nftTokenProgram = await getTokenProgramFromMint(provider, nftMint.toString());
	if (!nftTokenProgram) {
		return undefined;
	}

	const initializerNftTa = getAtaAddress(nftMint.toString(), initializer, nftTokenProgram.toString());

	const nftProgram = await getNftProgramFromMint(provider, nftMint.toString());

	const eventAuthority = getEventAuthority();
	const remainingAccounts: AccountMeta[] = await getRemainingAccountsForMint(provider, nftMint.toString(), extraAccountParams);

	const ix = await marketProgram.methods
		.cancelListing()
		.accountsStrict({
			initializer: provider.publicKey,
			market: order.market,
			nftMint,
			order: orderAddress,
			initializerNftTa,
			nftProgram: nftProgram ?? PublicKey.default,
			nftTokenProgram,
			sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
		})
		.remainingAccounts(remainingAccounts)
		.instruction();

	return ix;
};

// Cancel Bid
export const getCancelBid = async (provider: Provider, orderAddress: PublicKey) => {
	const marketProgram = getMarketplaceProgram(provider);
	const initializer = provider.publicKey?.toString();
	if (!initializer) {
		return undefined;
	}

	const order = await fetchOrderByAddress(provider, orderAddress.toString());
	if (!order) {
		return undefined;
	}

	const paymentMint = order.paymentMint.toString();
	const paymentTokenProgram = await getTokenProgramFromMint(provider, paymentMint);
	if (!paymentTokenProgram) {
		return undefined;
	}

	const initializerPaymentTa = getAtaAddress(paymentMint, initializer, paymentTokenProgram.toString());
	const orderPaymentTa = getAtaAddress(paymentMint, orderAddress.toString(), paymentTokenProgram.toString());

	const eventAuthority = getEventAuthority();

	const ix = await marketProgram.methods
		.cancelBid()
		.accountsStrict({
			initializer: provider.publicKey,
			market: order.market,
			paymentMint,
			order: orderAddress,
			initializerPaymentTa,
			orderPaymentTa,
			paymentTokenProgram,
			associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
			systemProgram: SystemProgram.programId,
			program: marketplaceProgramId,
			eventAuthority,
		})
		.instruction();

	return ix;
};
