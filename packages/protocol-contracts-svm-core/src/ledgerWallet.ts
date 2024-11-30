import { Wallet as AnchorWallet } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  TransactionMessage,
  MessageV0,
  Keypair,
} from "@solana/web3.js";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import AppSolana from "@ledgerhq/hw-app-solana";

export class LedgerWallet implements AnchorWallet {
  private solanaApp: AppSolana;
  private derivationPath: string;
  public publicKey: PublicKey;

  constructor() {
    this.derivationPath = "44'/501'";
    // Initialization will be done in the init() method
    // this.derivationPath = "44'/501'/0'/0'";
    // 9M5fNp65vzp3MqkwPFU95WvnuPfpefwe3HbT1E1MZGTx

    // this.derivationPath = "44'/501'";
    // 674s1Sap3KVnr8WGrY5KGQ69oTYjjgr1disKJo6GpTYw
  }
    payer: Keypair;

  /**
   * Initializes the connection to the Ledger device and retrieves the public key.
   */
  async init(): Promise<void> {
    const transport = await TransportNodeHid.create();
    this.solanaApp = new AppSolana(transport);
    const result = await this.solanaApp.getAddress(this.derivationPath);
    this.publicKey = new PublicKey(result.address);
  }

  /**
   * Signs a single transaction using the Ledger device.
   * @param tx The transaction to sign.
   * @returns The signed transaction.
   */
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    // Handle VersionedTransaction
    if (tx instanceof VersionedTransaction) {
      // Ledger currently does not support VersionedTransaction directly
      // Attempt to convert it to a Transaction if possible
      const legacyTx = this.convertToLegacyTransaction(tx);
      if (!legacyTx) {
        throw new Error("Cannot sign VersionedTransaction with Ledger wallet");
      }
      // Sign the legacy transaction
      const signedTx = await this.signLegacyTransaction(legacyTx);
      // Convert back to VersionedTransaction
      const signedVersionedTx = VersionedTransaction.deserialize(signedTx.serialize());
      return signedVersionedTx as T;
    }

    // Handle Legacy Transaction
    if (tx instanceof Transaction) {
      return (await this.signLegacyTransaction(tx)) as T;
    }

    throw new Error("Unsupported transaction type");
  }

  /**
   * Signs all transactions using the Ledger device.
   * @param txs An array of transactions to sign.
   * @returns An array of signed transactions.
   */
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    const signedTxs: T[] = [];
    for (const tx of txs) {
      const signedTx = await this.signTransaction(tx);
      signedTxs.push(signedTx);
    }
    return signedTxs;
  }

  /**
   * Signs a legacy transaction.
   * @param tx The legacy transaction to sign.
   * @returns The signed transaction.
   */
  private async signLegacyTransaction(tx: Transaction): Promise<Transaction> {
    if (!tx.recentBlockhash) {
      throw new Error("Transaction is missing a recent blockhash");
    }
    if (!tx.feePayer) {
      tx.feePayer = this.publicKey;
    }

    const txBytes = tx.serializeMessage();
    const signature = await this.solanaApp.signTransaction(this.derivationPath, txBytes);
    const signatureBytes = Buffer.from(signature.signature);
    tx.addSignature(this.publicKey, signatureBytes);

    if (!tx.verifySignatures()) {
      throw new Error("Signature verification failed");
    }

    return tx;
  }

  /**
   * Attempts to convert a VersionedTransaction to a Legacy Transaction.
   * @param vtx The VersionedTransaction to convert.
   * @returns A Transaction if conversion is possible, otherwise null.
   */
  private convertToLegacyTransaction(vtx: VersionedTransaction): Transaction | null {
    try {
      const message = TransactionMessage.decompile(vtx.message);
      // Only proceed if the message is compatible with legacy transactions
      if (!(message instanceof MessageV0)) {
        const tx = new Transaction();
        tx.recentBlockhash = message.recentBlockhash;
        tx.feePayer = message.payerKey || this.publicKey;
        tx.instructions = message.instructions;
        return tx;
      }
    } catch (error) {
      // Cannot convert
    }
    return null;
  }
}
