import { Keypair, MessageV0, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { CreateOrderArgs, getCancelBid, fetchOrdersByMarket, fetchOrdersByMint, fetchOrdersByUser, fillOrder, getBid, getCancelListing, getComputeBudgetInstructions, getInitializeMarket, getListNft, getMarketPda, getOrderAccount, getProvider, getVerifyMint } from "../clients/rarible-svm-ts/src";

const demoMarket = {
    marketIdentifier: new PublicKey("5hHaru7wRzFzHs9Fm7DK2vCXEC6v8zN9xutXYLHpEqG"),
    wnsGroupMint: "EXJB8YFiBpFeBbjq9PZhCsav2RfcZVeuBvT9t3jBuY5f",
    paymentMint: "So11111111111111111111111111111111111111112",
    feeRecipients: ["yaoYaopKcDsMxnjbT1jBdvYz6XRmjPdAPHczsCraERc", "9xakHBpJ8gQTi4NYKyLhUm786e4sEeWxMQPz2ph7SPLt", "CQMFZGhqvt87nhqRo6eEq3TDHCUbU4mzmpVooR2M6So1"],
    feeBps: [250, 150, 100]
};

const mintsToVerify = ["4swpX19vkSyd2TLM2W2FcsHorkvh25aEg4b35H4Vf2Wv", "71xkPoBLf5DRmCkPJo9czuNL3docUuweeDARABcNsaVy", "CchC7gtAUL1bDbuomRkjupySAZcMAygRb983r3qnkXFv"];

const listingData = [{
        nftMint: "CchC7gtAUL1bDbuomRkjupySAZcMAygRb983r3qnkXFv",
        price: 15000,
        size: 1,
    },
    {
        nftMint: "2RdFkcThfSX4ymoYEuzLLPCgTY6Dd4KMj3Mq8PnpeTWZ",
        price: 24000,
        size: 1,
    }
];

const biddingData = [
    {
    price: 7500,
    size: 2,
    nftMint: undefined,
},
{
    price: 10000,
    size: 1,
    nftMint: undefined,
}
];

const nftToSell = "CchC7gtAUL1bDbuomRkjupySAZcMAygRb983r3qnkXFv";

async function setupMarket() {
    const provider = getProvider();
    const { marketIdentifier, feeBps, feeRecipients } = demoMarket;
    const createMarketIx = await getInitializeMarket(provider, { marketIdentifier: marketIdentifier.toString(), feeBps, feeRecipients });
    const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
    const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [createMarketIx], recentBlockhash, })
    const tx = new VersionedTransaction(message);
    const signedTx = await provider.wallet.signTransaction(tx);

    try{
        const txSig = await provider.connection.sendTransaction(signedTx);
        console.log("Create Market --", txSig);
    } catch (e) {
        console.log(e);
    }
}

async function verifyMints() {
    const provider = getProvider();
    const { marketIdentifier } = demoMarket;

    const marketAddress = getMarketPda(marketIdentifier.toString());

    const addMintIxs = await Promise.all(mintsToVerify.map((m) => getVerifyMint(provider, m, marketAddress.toString())));
    for (let i = 0; i < addMintIxs.length; i = i + 5) {
        const mintIxs = addMintIxs.slice(i, Math.min(addMintIxs.length, i + 5));
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...mintIxs], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);
    
        try{
            const txSig = await provider.connection.sendTransaction(signedTx);
            console.log("Verify --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

async function listNfts() {
    const provider = getProvider();
    const { marketIdentifier, paymentMint, wnsGroupMint } = demoMarket;

    const wnsParams = {
        groupMint: wnsGroupMint,
        paymentMint
    };
    const listings: CreateOrderArgs[] = listingData.map((m) => { return {
        marketIdentifier: marketIdentifier.toString(),
        nftMint: m.nftMint,
        paymentMint,
        price: m.price,
        size: 1,
        extraAccountParams: wnsParams,
    }})
    
    const listNftIxs = await Promise.all(listings.map((l) => getListNft(provider, l)));

    for (let i = 0; i < listNftIxs.length; i++) {
        const computeIxs = getComputeBudgetInstructions({ computeUnits: 300_000 });
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...computeIxs, listNftIxs[i]], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);

        try{
            const txSig = await provider.connection.sendTransaction(signedTx, { skipPreflight: true });
            console.log("List --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

async function bid() {
    const provider = getProvider();
    const { marketIdentifier, paymentMint } = demoMarket;

    const bids: CreateOrderArgs[] = biddingData.map(b => {
        return {
            marketIdentifier: marketIdentifier.toString(),
            paymentMint,
            price: b.price,
            size: b.size,
            nftMint: b.nftMint,
            extraAccountParams: undefined,
        }
    });

    const bidNftIxs = await Promise.all(bids.map((b) => getBid(provider, b)));

    for (let i = 0; i < bidNftIxs.length; i++) {
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [bidNftIxs[i]], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);

        try{
            const txSig = await provider.connection.sendTransaction(signedTx);
            console.log("Bid --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

async function sellNft() {
    const provider = getProvider();
    const { marketIdentifier, paymentMint, wnsGroupMint } = demoMarket;

    const marketAddress = getMarketPda(marketIdentifier.toString());

    const wnsParams = {
        groupMint: wnsGroupMint,
        paymentMint
    };

    const activeOrders = (await fetchOrdersByMarket(provider, marketAddress.toString())).filter((o) => o.account.state == 0).filter(o => o !== undefined).filter((o) => o.account.paymentMint.toString() === paymentMint).filter((o) => o.account.owner.toString() !== provider.wallet.publicKey.toString());
    const topBid = activeOrders.filter(o => o.account.side == 0 && o.publicKey.toString() !== "U8b7wU4hbUGFkUXioFzdfLz9YDFzDdD7VPrCV3VGcEq").sort((a, b) => a.account.price.toNumber() - b.account.price.toNumber()).pop();

    // console.log(topBid.account.price.toNumber());
    if (topBid !== undefined) {
        const buyNftIx = await fillOrder(provider, topBid.publicKey.toString(), 1, nftToSell, wnsParams);
        
        const computeIxs = getComputeBudgetInstructions({ computeUnits: 500_000 });
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...computeIxs, buyNftIx], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);
    
        try{
            const txSig = await provider.connection.sendTransaction(signedTx);
            console.log("Sell --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

async function buyNft() {
    const provider = getProvider();
    const { marketIdentifier } = demoMarket;

    const marketAddress = getMarketPda(marketIdentifier.toString());

    const {paymentMint, wnsGroupMint} = demoMarket;
    const wnsParams = {
        groupMint: wnsGroupMint,
        paymentMint
    };
   
    const activeOrders = (await fetchOrdersByMarket(provider, marketAddress.toString())).filter((o) => o.account.state == 0).filter(o => o !== undefined).sort((a, b) => b.account.price.toNumber() - a.account.price.toNumber());
    for (let i = 0; i < activeOrders.length; i++) {
        console.log(activeOrders[i].account.price.toNumber(), activeOrders[i].account.nftMint.toString())
    }
    const floorNft = activeOrders.filter(o => o.account.side == 1 && o.account.nftMint.toString() == "2RdFkcThfSX4ymoYEuzLLPCgTY6Dd4KMj3Mq8PnpeTWZ").pop();
    console.log(floorNft)
    if (floorNft !== undefined) {
        const buyNftIx = await fillOrder(provider, floorNft.publicKey.toString(), 1, floorNft.account.nftMint.toString(), wnsParams);
        
        const computeIxs = getComputeBudgetInstructions({ computeUnits: 500_000 });
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...computeIxs, buyNftIx], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);
    
        try{
            const txSig = await provider.connection.sendTransaction(signedTx, { skipPreflight: true });
            console.log("Buy --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

async function cancelListings() {
    const provider = getProvider();
    const { paymentMint, wnsGroupMint } = demoMarket;

    const wnsParams = {
        groupMint: wnsGroupMint,
        paymentMint
    };
   
    // 0 = buy
    // 1 = sell
    const ordersForUser = (await fetchOrdersByUser(provider, provider.publicKey.toString())).filter(o => o.account.state == 0).filter(o => o.account.side == 1);

    const cancelListingsIxs = await Promise.all(ordersForUser.map(o => getCancelListing(provider, o.publicKey, wnsParams)));

    for (let i = 0; i < cancelListingsIxs.length; i++) {
        const computeIxs = getComputeBudgetInstructions({ computeUnits: 300_000 });
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...computeIxs, cancelListingsIxs[i]], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);

        try{
            const txSig = await provider.connection.sendTransaction(signedTx);
            console.log("Cancel Listing --", txSig);
        } catch (e) {
            console.log("Cancel Listing Failed for --", ordersForUser[i].publicKey.toString());
        }
    }
}

async function cancelBids() {
    const provider = getProvider();
   
    const bidsForUser = (await fetchOrdersByUser(provider, provider.publicKey.toString())).filter(o => o.account.state == 0).filter(o => o.account.side == 0);

    const cancelBidIxs = await Promise.all(bidsForUser.map(o => getCancelBid(provider, o.publicKey)));

    for (let i = 0; i < cancelBidIxs.length; i++) {
        const computeIxs = getComputeBudgetInstructions({ computeUnits: 300_000 });
        const recentBlockhash = (await provider.connection.getLatestBlockhash()).blockhash;
        const message = MessageV0.compile({ payerKey: provider.publicKey, instructions: [...computeIxs, cancelBidIxs[i]], recentBlockhash, })
        const tx = new VersionedTransaction(message);
        const signedTx = await provider.wallet.signTransaction(tx);

        try{
            const txSig = await provider.connection.sendTransaction(signedTx);
            console.log("Cancel Listing --", txSig);
        } catch (e) {
            console.log(e);
        }
    }
}

// setupMarket();
// verifyMints();
// listNfts();
// bid();
// sellNft();
buyNft();
// cancelListings();
// cancelBids();