import express from "express";
import { claimDistribution, createCollectionWithRoyalties, mintNft, transferMint } from "./util";

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/createCollectionAccount", async (req, res) => {
    /*
        Will use AUTHORITY_ACCOUNT as signer and collection authority, will mint Collection NFT to AUTHORITY_ACCOUNT
        BODY --
        name: string; 
        symbol: string; 
        uri: string; 
        maxSize: number;
    */
    const txn = await createCollectionWithRoyalties(req.body);
    res.send(txn);
});

app.post("/createMintAccount", async (req, res) => {
    /*
        Will use AUTHORITY_ACCOUNT as signer for collection authority, will use USER_ACCOUNT as payer and receiver of NFT
        BODY --
        name: string; 
        symbol: string; 
        uri: string; 
        collection: string; 
        royaltyBasisPoints: number; 
        creators: {
            address: string;
            share: number;
        }[]
    */
    const txn = await mintNft(req.body);
    res.send(txn);
});

app.post("/transferMint", async (req, res) => {
    /*
        Will use USER_ACCOUNT as signer and "from" account
        BODY --
        collection: string;
        nftMint: string;
        paymentMint: string;
        paymentAmount: number;
        to: string;
    */
    const txn = await transferMint(req.body);
    res.send(txn);
});

app.post("/claimRoyalties", async (req, res) => {
    /*
        Will use AUTHORITY_ACCOUNT as signer and "creator" account
        BODY --
        collection: string;
        mintToClaim: string;
    */
    const txn = await claimDistribution(req.body);
    res.send(txn);
});

app.get("/", async function (_, res) {
    res.send({ status: "true" });
});

app.listen(80, async () => {
    console.log("The application is listening on port 80!");
});
