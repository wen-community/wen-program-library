/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  assertAccountExists,
  assertAccountsExist,
  combineCodec,
  decodeAccount,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  fixDecoderSize,
  fixEncoderSize,
  getAddressDecoder,
  getAddressEncoder,
  getBytesDecoder,
  getBytesEncoder,
  getStructDecoder,
  getStructEncoder,
  getU64Decoder,
  getU64Encoder,
  getU8Decoder,
  getU8Encoder,
  transformEncoder,
  type Account,
  type Address,
  type Codec,
  type Decoder,
  type EncodedAccount,
  type Encoder,
  type FetchAccountConfig,
  type FetchAccountsConfig,
  type MaybeAccount,
  type MaybeEncodedAccount,
  type ReadonlyUint8Array,
} from '@solana/web3.js';

export type Listing = {
  discriminator: ReadonlyUint8Array;
  bump: number;
  mint: Address;
  paymentMint: Address;
  seller: Address;
  sellerTokenAccount: Address;
  listingAmount: bigint;
};

export type ListingArgs = {
  bump: number;
  mint: Address;
  paymentMint: Address;
  seller: Address;
  sellerTokenAccount: Address;
  listingAmount: number | bigint;
};

export function getListingEncoder(): Encoder<ListingArgs> {
  return transformEncoder(
    getStructEncoder([
      ['discriminator', fixEncoderSize(getBytesEncoder(), 8)],
      ['bump', getU8Encoder()],
      ['mint', getAddressEncoder()],
      ['paymentMint', getAddressEncoder()],
      ['seller', getAddressEncoder()],
      ['sellerTokenAccount', getAddressEncoder()],
      ['listingAmount', getU64Encoder()],
    ]),
    (value) => ({
      ...value,
      discriminator: new Uint8Array([218, 32, 50, 73, 43, 134, 26, 58]),
    })
  );
}

export function getListingDecoder(): Decoder<Listing> {
  return getStructDecoder([
    ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
    ['bump', getU8Decoder()],
    ['mint', getAddressDecoder()],
    ['paymentMint', getAddressDecoder()],
    ['seller', getAddressDecoder()],
    ['sellerTokenAccount', getAddressDecoder()],
    ['listingAmount', getU64Decoder()],
  ]);
}

export function getListingCodec(): Codec<ListingArgs, Listing> {
  return combineCodec(getListingEncoder(), getListingDecoder());
}

export function decodeListing<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress>
): Account<Listing, TAddress>;
export function decodeListing<TAddress extends string = string>(
  encodedAccount: MaybeEncodedAccount<TAddress>
): MaybeAccount<Listing, TAddress>;
export function decodeListing<TAddress extends string = string>(
  encodedAccount: EncodedAccount<TAddress> | MaybeEncodedAccount<TAddress>
): Account<Listing, TAddress> | MaybeAccount<Listing, TAddress> {
  return decodeAccount(
    encodedAccount as MaybeEncodedAccount<TAddress>,
    getListingDecoder()
  );
}

export async function fetchListing<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<Account<Listing, TAddress>> {
  const maybeAccount = await fetchMaybeListing(rpc, address, config);
  assertAccountExists(maybeAccount);
  return maybeAccount;
}

export async function fetchMaybeListing<TAddress extends string = string>(
  rpc: Parameters<typeof fetchEncodedAccount>[0],
  address: Address<TAddress>,
  config?: FetchAccountConfig
): Promise<MaybeAccount<Listing, TAddress>> {
  const maybeAccount = await fetchEncodedAccount(rpc, address, config);
  return decodeListing(maybeAccount);
}

export async function fetchAllListing(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<Account<Listing>[]> {
  const maybeAccounts = await fetchAllMaybeListing(rpc, addresses, config);
  assertAccountsExist(maybeAccounts);
  return maybeAccounts;
}

export async function fetchAllMaybeListing(
  rpc: Parameters<typeof fetchEncodedAccounts>[0],
  addresses: Array<Address>,
  config?: FetchAccountsConfig
): Promise<MaybeAccount<Listing>[]> {
  const maybeAccounts = await fetchEncodedAccounts(rpc, addresses, config);
  return maybeAccounts.map((maybeAccount) => decodeListing(maybeAccount));
}

export function getListingSize(): number {
  return 145;
}
