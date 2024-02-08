import { PublicKey, Keypair } from "@solana/web3.js";

export const TOKEN_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const DISTRIBUTION_PROGRAM_ID = new PublicKey("8fZkX7UXQ8iGes5evhScXjrGfaVgJc76QZiQVWBtLyhc");
export const WNS_PROGRAM_ID = new PublicKey("8e9NZefQowF1ViN4eiz8r3wgKw9xLESGkkQEZJWox49o");

export const CONNECTION_URL = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com/";

export const AUTHORITY_ACCOUNT = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.AUTHORITY_KEYPAIR ?? "")));
export const USER_ACCOUNT = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.USER_KEYPAIR ?? "")));