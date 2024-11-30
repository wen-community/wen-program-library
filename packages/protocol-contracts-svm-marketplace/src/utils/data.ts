import { AnchorProvider } from "@coral-xyz/anchor";
import { getRaribleMarketplaceProgram } from "@rarible_int/protocol-contracts-svm-core";

// Fetch order
export const fetchOrderByAddress = async (provider: AnchorProvider, orderAddress: string) => {
	const marketplaceProgram = getRaribleMarketplaceProgram(provider)
	try {
		const orderAccount = await marketplaceProgram.account.order.fetch(orderAddress);
		return orderAccount;
	} catch (e) {
		return undefined;
	}
};

// Fetch market
export const fetchMarketByAddress = async (provider: AnchorProvider, marketAddress: string) => {
	const marketplaceProgram = getRaribleMarketplaceProgram(provider);
	try {
		const marketAccount = await marketplaceProgram.account.market.fetch(marketAddress);
		return marketAccount;
	} catch (e) {
		return undefined;
	}
};