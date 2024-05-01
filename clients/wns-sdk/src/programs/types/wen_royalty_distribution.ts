/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wen_royalty_distribution.json`.
 */
export type WenRoyaltyDistribution = {
  "address": "diste3nXmK7ddDTs1zb6uday6j4etCa9RChD8fJ1xay",
  "metadata": {
    "name": "wenRoyaltyDistribution",
    "version": "0.2.0-alpha",
    "spec": "0.1.0",
    "description": "Distribution program for WNS royalties"
  },
  "instructions": [
    {
      "name": "claimDistribution",
      "docs": [
        "Claim royalties from a distribution account."
      ],
      "discriminator": [
        204,
        156,
        94,
        85,
        2,
        125,
        232,
        180
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "distribution",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "distribution.group_mint",
                "account": "distributionAccount"
              },
              {
                "kind": "arg",
                "path": "paymentMint"
              }
            ]
          }
        },
        {
          "name": "distributionTokenAccount",
          "writable": true
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "initializeDistribution",
      "docs": [
        "Initializes a new distribution account."
      ],
      "discriminator": [
        146,
        158,
        129,
        53,
        22,
        89,
        86,
        207
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "groupMint"
        },
        {
          "name": "distributionAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "groupMint"
              },
              {
                "kind": "arg",
                "path": "paymentMint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateDistribution",
      "docs": [
        "Update royalty amount for creators a distribution account."
      ],
      "discriminator": [
        128,
        196,
        209,
        174,
        42,
        209,
        164,
        222
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "distributionAccount",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true
        },
        {
          "name": "distributionTokenAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateDistributionArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "distributionAccount",
      "discriminator": [
        98,
        90,
        112,
        65,
        49,
        161,
        198,
        154
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidGroupAuthority",
      "msg": "Invalid Group Authority for collection account"
    },
    {
      "code": 6001,
      "name": "invalidCreatorPctAmount",
      "msg": "Invalid creator pct amount. Must add up to 100"
    },
    {
      "code": 6002,
      "name": "arithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "docs": [
              "creator address"
            ],
            "type": "pubkey"
          },
          {
            "name": "claimAmount",
            "docs": [
              "token amount that creator can claim"
            ],
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "distributionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "distribution version"
            ],
            "type": "u8"
          },
          {
            "name": "groupMint",
            "docs": [
              "group to which the distribution account belongs to"
            ],
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "docs": [
              "payment mint for the distribution account"
            ],
            "type": "pubkey"
          },
          {
            "name": "claimData",
            "type": {
              "vec": {
                "defined": {
                  "name": "creator"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "updateDistributionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};
