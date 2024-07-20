/**
 * This code was AUTOGENERATED using the kinobi library.
 * Please DO NOT EDIT THIS FILE, instead use visitors
 * to add features, then rerun kinobi to update it.
 *
 * @see https://github.com/kinobi-so/kinobi
 */

import {
  fixEncoderSize,
  getAddressEncoder,
  getBytesEncoder,
  getProgramDerivedAddress,
  type Address,
  type ProgramDerivedAddress,
} from '@solana/web3.js';

export type GroupSeeds = {
  mint: Address;
};

export async function findGroupPda(
  seeds: GroupSeeds,
  config: { programAddress?: Address | undefined } = {}
): Promise<ProgramDerivedAddress> {
  const {
    programAddress = 'wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM' as Address<'wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM'>,
  } = config;
  return await getProgramDerivedAddress({
    programAddress,
    seeds: [
      fixEncoderSize(getBytesEncoder(), 5).encode(
        new Uint8Array([103, 114, 111, 117, 112])
      ),
      getAddressEncoder().encode(seeds.mint),
    ],
  });
}