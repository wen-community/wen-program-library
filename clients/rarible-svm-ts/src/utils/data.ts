import {type Provider} from '@coral-xyz/anchor';
import {getMarketplaceProgram, getVerificationPda} from './core';
import {type PublicKey} from '@solana/web3.js';

// Fetch market
export const fetchMarketByAddress = async (provider: Provider, marketAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const marketAccount = await marketplaceProgram.account.market.fetch(marketAddress);

		return marketAccount;
	} catch (e) {
		return undefined;
	}
};

// Fetch markets by initializer
export const fetchMarketByInitializer = async (provider: Provider, initializerAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const marketAccounts = await marketplaceProgram.account.market.all(
			[
				{
					memcmp: {
						offset: 8 + 1 + 32,
						bytes: initializerAddress,
					},
				},
			],
		);

		return marketAccounts;
	} catch (e) {
		return undefined;
	}
};

// Fetch order
export const fetchOrderByAddress = async (provider: Provider, orderAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const orderAccount = await marketplaceProgram.account.order.fetch(orderAddress);

		return orderAccount;
	} catch (e) {
		return undefined;
	}
};

// Fetch orders for market
export const fetchOrdersByMarket = async (provider: Provider, marketAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const orderAccounts = await marketplaceProgram.account.order.all(
			[
				{
					memcmp: {
						offset: 8 + 1 + 32,
						bytes: marketAddress,
					},
				},
			],
		);

		return orderAccounts;
	} catch (e) {
		return undefined;
	}
};

// Fetch orders for mint
export const fetchOrdersByMint = async (provider: Provider, nftMint: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const orderAccounts = await marketplaceProgram.account.order.all(
			[
				{
					memcmp: {
						offset: 8 + 1 + 32 + 32 + 32 + 1 + 8 + 8 + 1 + 8 + 8,
						bytes: nftMint,
					},
				},
			],
		);

		return orderAccounts;
	} catch (e) {
		return undefined;
	}
};

// Fetch orders for user
export const fetchOrdersByUser = async (provider: Provider, user: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);

	try {
		const orderAccounts = await marketplaceProgram.account.order.all(
			[
				{
					memcmp: {
						offset: 8 + 1 + 32 + 32,
						bytes: user,
					},
				},
			],
		);

		return orderAccounts;
	} catch (e) {
		return undefined;
	}
};

// Verfiy mint belongs in market
export const verifyMintInMarket = async (provider: Provider, nftMint: string, marketAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);
	const verificationAddress = getVerificationPda(marketAddress, nftMint);

	try {
		const verificationAccount = await marketplaceProgram.account.mintVerification.fetch(verificationAddress);

		return verificationAccount !== undefined;
	} catch (e) {
		return false;
	}
};

export const test = async (provider: Provider, nftMint: string, marketAddress: string) => {
	const marketplaceProgram = getMarketplaceProgram(provider);
	return (typeof marketplaceProgram.account.order);
};

export type Order = {
	version: number;
	nonce: PublicKey;
	market: PublicKey;
	owner: PublicKey;
	side: number;
	size: number;
	price: number;
	state: number;
	initTime: number;
	lastEditTime: number;
	nftMint: PublicKey;
	paymentMint: PublicKey;
	feesOn: boolean;
};
