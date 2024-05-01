/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/wen_new_standard.json`.
 */
export type WenNewStandard = {
  "address": "wns1gDLt8fgLcGhWi5MqAqgXpwEP1JftKE9eZnXS1HM",
  "metadata": {
    "name": "wenNewStandard",
    "version": "0.3.2-alpha",
    "spec": "0.1.0",
    "description": "An open and composable NFT standard on Solana."
  },
  "instructions": [
    {
      "name": "addMetadata",
      "docs": [
        "add additional metadata to mint"
      ],
      "discriminator": [
        231,
        195,
        40,
        240,
        67,
        231,
        53,
        136
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "vec": {
              "defined": {
                "name": "addMetadataArgs"
              }
            }
          }
        }
      ]
    },
    {
      "name": "addMintToGroup",
      "docs": [
        "add mint to group"
      ],
      "discriminator": [
        236,
        25,
        99,
        48,
        185,
        60,
        235,
        112
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "writable": true
        },
        {
          "name": "member",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "addRoyalties",
      "docs": [
        "add royalties to mint"
      ],
      "discriminator": [
        195,
        251,
        126,
        230,
        187,
        134,
        168,
        210
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "extraMetasAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateRoyaltiesArgs"
            }
          }
        }
      ]
    },
    {
      "name": "approveTransfer",
      "docs": [
        "approve transfer"
      ],
      "discriminator": [
        198,
        217,
        247,
        150,
        208,
        60,
        169,
        244
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "approveAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  112,
                  112,
                  114,
                  111,
                  118,
                  101,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "paymentMint"
        },
        {
          "name": "distributionTokenAccount",
          "writable": true
        },
        {
          "name": "authorityTokenAccount",
          "writable": true
        },
        {
          "name": "distributionAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "distributionProgram",
          "address": "diste3nXmK7ddDTs1zb6uday6j4etCa9RChD8fJ1xay"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        }
      ],
      "args": [
        {
          "name": "buyAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "burnMintAccount",
      "docs": [
        "burn mint"
      ],
      "discriminator": [
        60,
        58,
        247,
        183,
        185,
        54,
        114,
        131
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "user",
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "mintTokenAccount",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "createGroupAccount",
      "docs": [
        "Token group instructions",
        "create group"
      ],
      "discriminator": [
        34,
        65,
        118,
        12,
        64,
        190,
        211,
        145
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "signer": true
        },
        {
          "name": "receiver"
        },
        {
          "name": "group",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintTokenAccount",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createGroupAccountArgs"
            }
          }
        }
      ]
    },
    {
      "name": "createMintAccount",
      "docs": [
        "create mint"
      ],
      "discriminator": [
        76,
        184,
        50,
        62,
        162,
        141,
        47,
        103
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "receiver"
        },
        {
          "name": "mint",
          "writable": true,
          "signer": true
        },
        {
          "name": "mintTokenAccount",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "createMintAccountArgs"
            }
          }
        }
      ]
    },
    {
      "name": "execute",
      "docs": [
        "Royalty distribution + enforcement instructions",
        "validate transfer"
      ],
      "discriminator": [
        105,
        37,
        101,
        197,
        75,
        251,
        102,
        26
      ],
      "accounts": [
        {
          "name": "sourceAccount"
        },
        {
          "name": "mint"
        },
        {
          "name": "destinationAccount"
        },
        {
          "name": "ownerDelegate"
        },
        {
          "name": "extraMetasAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  120,
                  116,
                  114,
                  97,
                  45,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116,
                  45,
                  109,
                  101,
                  116,
                  97,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "freezeMintAccount",
      "docs": [
        "freeze mint"
      ],
      "discriminator": [
        171,
        30,
        154,
        191,
        27,
        0,
        134,
        216
      ],
      "accounts": [
        {
          "name": "user"
        },
        {
          "name": "delegateAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "mintTokenAccount",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "initManagerAccount",
      "docs": [
        "Init manager account"
      ],
      "discriminator": [
        63,
        114,
        69,
        118,
        3,
        198,
        215,
        72
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "manager",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "modifyRoyalties",
      "docs": [
        "modify royalties of mint"
      ],
      "discriminator": [
        199,
        95,
        20,
        107,
        136,
        161,
        93,
        137
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateRoyaltiesArgs"
            }
          }
        }
      ]
    },
    {
      "name": "removeMetadata",
      "docs": [
        "remove additional metadata to mint"
      ],
      "discriminator": [
        81,
        68,
        231,
        49,
        91,
        8,
        111,
        160
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "vec": {
              "defined": {
                "name": "removeMetadataArgs"
              }
            }
          }
        }
      ]
    },
    {
      "name": "thawMintAccount",
      "docs": [
        "thaw mint"
      ],
      "discriminator": [
        27,
        53,
        61,
        16,
        162,
        190,
        27,
        72
      ],
      "accounts": [
        {
          "name": "user"
        },
        {
          "name": "delegateAuthority",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
          "writable": true
        },
        {
          "name": "mintTokenAccount",
          "writable": true
        },
        {
          "name": "manager",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  110,
                  97,
                  103,
                  101,
                  114
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": []
    },
    {
      "name": "updateGroupAccount",
      "docs": [
        "update group"
      ],
      "discriminator": [
        153,
        106,
        174,
        53,
        133,
        171,
        207,
        52
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "authority"
        },
        {
          "name": "group",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  103,
                  114,
                  111,
                  117,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "mint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": {
              "name": "updateGroupAccountArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "approveAccount",
      "discriminator": [
        218,
        253,
        170,
        2,
        4,
        47,
        25,
        99
      ]
    },
    {
      "name": "manager",
      "discriminator": [
        221,
        78,
        171,
        233,
        213,
        142,
        113,
        56
      ]
    },
    {
      "name": "tokenGroup",
      "discriminator": [
        184,
        107,
        4,
        187,
        196,
        55,
        142,
        134
      ]
    },
    {
      "name": "tokenGroupMember",
      "discriminator": [
        17,
        208,
        50,
        173,
        30,
        127,
        245,
        94
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "sizeExceedsMaxSize",
      "msg": "Collection size exceeds max size."
    },
    {
      "code": 6001,
      "name": "maxSizeBelowCurrentSize",
      "msg": "Max size cannot be reduced below current size."
    },
    {
      "code": 6002,
      "name": "creatorShareInvalid",
      "msg": "Creators shares must add up to 100."
    },
    {
      "code": 6003,
      "name": "missingApproveAccount",
      "msg": "Missing approve account."
    },
    {
      "code": 6004,
      "name": "expiredApproveAccount",
      "msg": "Approve account has expired."
    },
    {
      "code": 6005,
      "name": "invalidField",
      "msg": "Invalid field. You cannot use a public key as a field."
    },
    {
      "code": 6006,
      "name": "creatorAddressInvalid",
      "msg": "The Address you provided is invalid. Please provide a valid address."
    },
    {
      "code": 6007,
      "name": "royaltyBasisPointsInvalid",
      "msg": "Royalty basis points must be less than or equal to 10000."
    }
  ],
  "types": [
    {
      "name": "addMetadataArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field",
            "type": "string"
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "approveAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "slot",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "createGroupAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "maxSize",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "createMintAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "permanentDelegate",
            "type": {
              "option": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "creatorWithShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "pubkey"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "manager",
      "docs": [
        "Data struct for a `Manager`"
      ],
      "type": {
        "kind": "struct",
        "fields": []
      }
    },
    {
      "name": "removeMetadataArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "field",
            "type": "string"
          },
          {
            "name": "value",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "tokenGroup",
      "docs": [
        "Data struct for a `TokenGroup`"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "updateAuthority",
            "docs": [
              "The authority that can sign to update the group"
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "The associated mint, used to counter spoofing to be sure that group",
              "belongs to a particular mint"
            ],
            "type": "pubkey"
          },
          {
            "name": "size",
            "docs": [
              "The current number of group members"
            ],
            "type": "u32"
          },
          {
            "name": "maxSize",
            "docs": [
              "The maximum number of group members"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "tokenGroupMember",
      "docs": [
        "Data struct for a `TokenGroupMember`"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "docs": [
              "The associated mint, used to counter spoofing to be sure that member",
              "belongs to a particular mint"
            ],
            "type": "pubkey"
          },
          {
            "name": "group",
            "docs": [
              "The pubkey of the `TokenGroup`"
            ],
            "type": "pubkey"
          },
          {
            "name": "memberNumber",
            "docs": [
              "The member number"
            ],
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updateGroupAccountArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "maxSize",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "updateRoyaltiesArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "royaltyBasisPoints",
            "type": "u16"
          },
          {
            "name": "creators",
            "type": {
              "vec": {
                "defined": {
                  "name": "creatorWithShare"
                }
              }
            }
          }
        ]
      }
    }
  ]
};
