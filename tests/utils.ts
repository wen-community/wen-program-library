import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Keypair,
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  Signer,
  Commitment,
} from "@solana/web3.js";
import { TYPE_SIZE, LENGTH_SIZE, getMintLen, ExtensionType } from "@solana/spl-token";
import { TokenMetadata, pack } from "@solana/spl-token-metadata";

export const MANAGER_SEED = Buffer.from("manager");
export const GROUP_ACCOUNT_SEED = Buffer.from("group");
export const MEMBER_ACCOUNT_SEED = Buffer.from("member");
export const TEST_SALE = Buffer.from("test_sale");
export const SALE = Buffer.from("sale");
export const LISTING = Buffer.from("listing");

export const getExtraMetasAccountPda = (mint: PublicKey, programId: PublicKey) => {
  const [extraMetasAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), mint.toBuffer()],
    programId
  );
  return extraMetasAccount;
};

export const getApproveAccountPda = (mint: PublicKey, programId: PublicKey) => {
  const [approveAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("approve-account"), mint.toBuffer()],
    programId
  );

  return approveAccount;
};

export const getManagerAccountPda = (programId: PublicKey) => {
  const [managerAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("manager")],
    programId
  );
  return managerAccount;
};

export const getGroupAccountPda = (mint: PublicKey, programId: PublicKey) => {
  const [groupAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("group"), mint.toBuffer()],
    programId
  );
  return groupAccount;
};

export const getMemberAccountPda = (mint: PublicKey, programId: PublicKey) => {
  const [memberAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("member"), mint.toBuffer()],
    programId
  );
  return memberAccount;
};

export const getDistributionAccountPda = (
  group: PublicKey,
  paymentMint: PublicKey,
  programId: PublicKey
) => {
  const [distributionAccount] = PublicKey.findProgramAddressSync(
    [group.toBuffer(), paymentMint.toBuffer()],
    programId
  );
  return distributionAccount;
};

export const getSaleAccountPda = (
  group: PublicKey,
  distribution: PublicKey,
  programId: PublicKey
) => {
  const [saleAccount] = PublicKey.findProgramAddressSync(
    [TEST_SALE, SALE, group.toBuffer(), distribution.toBuffer()],
    programId
  );
  return saleAccount;
};

export const getListingAccountPda = (
  seller: PublicKey,
  mint: PublicKey,
  programId: PublicKey
) => {
  const [listingAccount] = PublicKey.findProgramAddressSync(
    [TEST_SALE, LISTING, seller.toBuffer(), mint.toBuffer()],
    programId
  );
  return listingAccount;
};

export async function airdrop(
  connection: Connection,
  address: PublicKey,
  airdropLamports: number,
  commitment: Commitment = "confirmed"
) {
  const signature = await connection.requestAirdrop(address, airdropLamports);
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
    commitment
  );

  await connection.confirmTransaction(
    {
      blockhash,
      lastValidBlockHeight,
      signature,
    },
    commitment
  );
}

export async function getMinRentForWNSMint(
  connection: Connection,
  metaData: TokenMetadata,
  type: string
) {
  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;

  // Size of Mint Account with extensions
  const mintLen = getMintLen(
    [
      ExtensionType.MintCloseAuthority,
      ExtensionType.MetadataPointer,
      ExtensionType.TransferHook,
      ExtensionType.PermanentDelegate,
    ].concat(
      type === "member"
        ? [ExtensionType.GroupMemberPointer]
        : [ExtensionType.GroupPointer]
    )
  );

  // Minimum lamports required for Mint Account
  return connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );
}

export async function sendAndConfirmWNSTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  provider: AnchorProvider,
  skipPreflight = true,
  additionalSigners: Signer[] = []
): Promise<{ signature: string; feeEstimate: number }> {
  const transaction = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: provider.wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash("confirmed")).blockhash,
    }).compileToV0Message()
  );
  const signedTx = await provider.wallet.signTransaction(transaction);
  signedTx.sign(additionalSigners);

  try {
    const signature = await connection.sendTransaction(signedTx, {
      preflightCommitment: "confirmed",
      skipPreflight,
    });
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash(
      "confirmed"
    );
    await connection.confirmTransaction(
      {
        signature,
        lastValidBlockHeight,
        blockhash,
      },
      "confirmed"
    );
    return { signature, feeEstimate: 10000 };
  } catch (err) {
    throw err;
  }
}
