import { PublicKey, Keypair } from "@solana/web3.js";

export const TOKEN_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
export const DISTRIBUTION_PROGRAM_ID = new PublicKey("diste3nXmK7ddDTs1zb6uday6j4etCa9RChD8fJ1xay");
export const WNS_PROGRAM_ID = new PublicKey("wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM");

export const CONNECTION_URL = process.env.ANCHOR_PROVIDER_URL ?? "https://api.devnet.solana.com/";

export const AUTHORITY_ACCOUNT = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.AUTHORITY_KEYPAIR ?? "")));
export const USER_ACCOUNT = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.USER_KEYPAIR ?? "")));