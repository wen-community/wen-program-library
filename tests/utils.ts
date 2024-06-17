import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  VersionedTransaction,
  TransactionMessage,
  TransactionInstruction,
  Signer,
  Commitment,
  SystemProgram,
} from "@solana/web3.js";
import {
  TYPE_SIZE,
  LENGTH_SIZE,
  getMintLen,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  TOKEN_2022_PROGRAM_ID,
  createInitializeMint2Instruction,
  createMintToCheckedInstruction,
  createAssociatedTokenAccountInstruction,
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  TokenMetadata,
  pack,
  createInitializeInstruction,
} from "@solana/spl-token-metadata";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { faker } from "@faker-js/faker";

export const MANAGER_SEED = Buffer.from("manager");
export const GROUP_ACCOUNT_SEED = Buffer.from("group");
export const MEMBER_ACCOUNT_SEED = Buffer.from("member");
export const MARKETPLACE = Buffer.from("marketplace");
export const SALE = Buffer.from("sale");
export const LISTING = Buffer.from("listing");

export const getExtraMetasAccountPda = (
  mint: PublicKey,
  programId: PublicKey
) => {
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

export const getListingAccountPda = (
  seller: PublicKey,
  mint: PublicKey,
  programId: PublicKey
) => {
  const [listingAccount] = PublicKey.findProgramAddressSync(
    [MARKETPLACE, LISTING, seller.toBuffer(), mint.toBuffer()],
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
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash(commitment);

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

export async function createMintTokenKegIx(
  connection: Connection,
  mint: PublicKey,
  authority: PublicKey,
  payer: PublicKey
) {
  const space = getMintLen([]);
  const rent = await getMinimumBalanceForRentExemptMint(
    connection,
    "confirmed"
  );

  return {
    ixs: [
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mint,
        programId: TOKEN_PROGRAM_ID,
        space,
        lamports: rent,
      }),
      createInitializeMint2Instruction(mint, 6, authority, authority),
    ],
  };
}

export async function createMint2022Ix(
  connection: Connection,
  mint: PublicKey,
  authority: PublicKey,
  payer: PublicKey
) {
  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;

  const metadata: TokenMetadata = {
    mint,
    name: faker.finance.currencyName(),
    symbol: faker.finance.currencyCode(),
    uri: faker.image.urlPicsumPhotos(),
    additionalMetadata: [],
    updateAuthority: authority,
  };
  // Size of metadata
  const metadataLen = pack(metadata).length;

  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  // Minimum lamports required for Mint Account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  return {
    ixs: [
      SystemProgram.createAccount({
        fromPubkey: payer,
        newAccountPubkey: mint,
        programId: TOKEN_2022_PROGRAM_ID,
        space: mintLen,
        lamports: mintRent,
      }),
      createInitializeMetadataPointerInstruction(
        mint,
        authority,
        mint,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeMint2Instruction(
        mint,
        6,
        authority,
        authority,
        TOKEN_2022_PROGRAM_ID
      ),
      createInitializeInstruction({
        metadata: mint,
        mint,
        mintAuthority: authority,
        programId: TOKEN_2022_PROGRAM_ID,
        updateAuthority: authority,
        ...metadata,
      }),
    ],
  };
}

export function mintToBuyerSellerIx(
  mint: PublicKey,
  authority: PublicKey,
  payer: PublicKey,
  buyer: PublicKey,
  buyerTokenAccount: PublicKey,
  seller: PublicKey,
  sellerTokenAccount: PublicKey,
  tokenProgram: PublicKey = TOKEN_PROGRAM_ID
) {
  return {
    ixs: [
      createAssociatedTokenAccountInstruction(
        payer,
        buyerTokenAccount,
        buyer,
        mint,
        tokenProgram,
        ASSOCIATED_PROGRAM_ID
      ),
      createMintToCheckedInstruction(
        mint,
        buyerTokenAccount,
        authority,
        10_000 * 10 ** 6,
        6,
        [],
        tokenProgram
      ),
      createAssociatedTokenAccountInstruction(
        payer,
        sellerTokenAccount,
        seller,
        mint,
        tokenProgram,
        ASSOCIATED_PROGRAM_ID
      ),
      createMintToCheckedInstruction(
        mint,
        sellerTokenAccount,
        authority,
        10_000 * 10 ** 6,
        6,
        [],
        tokenProgram
      ),
    ],
  };
}

export async function sendAndConfirmWNSTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  provider: AnchorProvider,
  skipPreflight = true,
  additionalSigners: Signer[] = []
) {
  const transaction = new VersionedTransaction(
    new TransactionMessage({
      instructions,
      payerKey: provider.wallet.publicKey,
      recentBlockhash: (await connection.getLatestBlockhash("confirmed"))
        .blockhash,
    }).compileToV0Message()
  );
  const signedTx = await provider.wallet.signTransaction(transaction);
  signedTx.sign(additionalSigners);

  try {
    const signature = await connection.sendTransaction(signedTx, {
      preflightCommitment: "confirmed",
      skipPreflight,
    });
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    await connection.confirmTransaction(
      {
        signature,
        lastValidBlockHeight,
        blockhash,
      },
      "confirmed"
    );
    return signature;
  } catch (err) {
    throw err;
  }
}
