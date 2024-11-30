import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

export interface AnchorWallet {
    publicKey: PublicKey;
    signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;
    signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;
}

export interface IExecutorParams<T> {
    wallet: AnchorWallet,
    params: T,
    connection: Connection
}