/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rarible_editions_controls.json`.
 */
export type RaribleEditionsControls = {
  "address": "RariUNM3vz1rwxPg8UJyRAN7rSKXxgd2ncS2ddCa4ZE",
  "metadata": {
    "name": "raribleEditionsControls",
    "version": "0.2.1",
    "spec": "0.1.0",
    "description": "Created with Anchor",
    "repository": "https://github.com/rarible/eclipse-program-library"
  },
  "instructions": [
    {
      "name": "addPhase",
      "discriminator": [
        245,
        220,
        147,
        40,
        30,
        207,
        36,
        127
      ],
      "accounts": [
        {
          "name": "editionsControls",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "raribleEditionsProgram",
          "address": "Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn"
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "initialisePhaseInput"
            }
          }
        }
      ]
    },
    {
      "name": "initialiseEditionsControls",
      "discriminator": [
        69,
        176,
        133,
        29,
        20,
        49,
        120,
        202
      ],
      "accounts": [
        {
          "name": "editionsControls",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  105,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "editionsDeployment",
          "writable": true
        },
        {
          "name": "hashlist",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator"
        },
        {
          "name": "groupMint",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "groupExtensionProgram",
          "address": "RariGDYwEF1jQA4kisHxBxiv1TDuBPVHNNoXFNYriFb"
        },
        {
          "name": "raribleEditionsProgram",
          "address": "Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn"
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "initialiseControlInput"
            }
          }
        }
      ]
    },
    {
      "name": "mintWithControls",
      "discriminator": [
        167,
        57,
        252,
        220,
        69,
        92,
        231,
        61
      ],
      "accounts": [
        {
          "name": "editionsDeployment",
          "writable": true
        },
        {
          "name": "editionsControls",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  105,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "hashlist",
          "writable": true
        },
        {
          "name": "hashlistMarker",
          "writable": true
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "signer",
          "docs": [
            "When deployment.require_creator_cosign is true, this must be equal to the creator",
            "of the deployment; otherwise, can be any signer account"
          ],
          "signer": true
        },
        {
          "name": "minter",
          "writable": true
        },
        {
          "name": "minterStats",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              },
              {
                "kind": "account",
                "path": "minter"
              }
            ]
          }
        },
        {
          "name": "minterStatsPhase",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  101,
                  114,
                  95,
                  115,
                  116,
                  97,
                  116,
                  115,
                  95,
                  112,
                  104,
                  97,
                  115,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              },
              {
                "kind": "account",
                "path": "minter"
              },
              {
                "kind": "arg",
                "path": "mint_input.phase_index"
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
          "name": "member",
          "writable": true,
          "signer": true
        },
        {
          "name": "group",
          "writable": true
        },
        {
          "name": "groupMint",
          "writable": true
        },
        {
          "name": "platformFeeRecipient1",
          "writable": true
        },
        {
          "name": "tokenAccount",
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        },
        {
          "name": "tokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "groupExtensionProgram",
          "address": "RariGDYwEF1jQA4kisHxBxiv1TDuBPVHNNoXFNYriFb"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "raribleEditionsProgram",
          "address": "Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn"
        }
      ],
      "args": [
        {
          "name": "mintInput",
          "type": {
            "defined": {
              "name": "mintInput"
            }
          }
        }
      ]
    },
    {
      "name": "modifyPlatformFee",
      "discriminator": [
        186,
        73,
        229,
        152,
        183,
        174,
        250,
        197
      ],
      "accounts": [
        {
          "name": "editionsDeployment",
          "writable": true
        },
        {
          "name": "editionsControls",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  105,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "updatePlatformFeeArgs"
            }
          }
        }
      ]
    },
    {
      "name": "modifyPlatformSecondaryAdmin",
      "discriminator": [
        128,
        153,
        231,
        143,
        156,
        220,
        161,
        147
      ],
      "accounts": [
        {
          "name": "editionsDeployment",
          "writable": true
        },
        {
          "name": "editionsControls",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  105,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "updatePlatformFeeSecondaryAdminInput"
            }
          }
        }
      ]
    },
    {
      "name": "modifyRoyalties",
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
          "name": "editionsDeployment",
          "writable": true
        },
        {
          "name": "editionsControls",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  101,
                  100,
                  105,
                  116,
                  105,
                  111,
                  110,
                  115,
                  95,
                  99,
                  111,
                  110,
                  116,
                  114,
                  111,
                  108,
                  115
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "creator",
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
        },
        {
          "name": "raribleEditionsProgram",
          "address": "Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn"
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "updateRoyaltiesArgs"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "editionsControls",
      "discriminator": [
        124,
        32,
        239,
        85,
        118,
        231,
        152,
        156
      ]
    },
    {
      "name": "editionsDeployment",
      "discriminator": [
        101,
        54,
        68,
        216,
        168,
        131,
        242,
        157
      ]
    },
    {
      "name": "minterStats",
      "discriminator": [
        138,
        239,
        240,
        226,
        199,
        53,
        170,
        179
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "tickerTooLong",
      "msg": "Ticker too long"
    },
    {
      "code": 6001,
      "name": "mintTemplateTooLong",
      "msg": "Mint template too long"
    },
    {
      "code": 6002,
      "name": "deploymentTemplateTooLong",
      "msg": "Deployment template too long"
    },
    {
      "code": 6003,
      "name": "rootTypeTooLong",
      "msg": "Root type too long"
    },
    {
      "code": 6004,
      "name": "mintedOut",
      "msg": "Minted out"
    },
    {
      "code": 6005,
      "name": "legacyMigrationsAreMintedOut",
      "msg": "Legacy migrations are minted out"
    },
    {
      "code": 6006,
      "name": "missingGlobalTreeDelegate",
      "msg": "Global tree delegate is missing"
    },
    {
      "code": 6007,
      "name": "incorrectMintType",
      "msg": "Incorrect mint type"
    },
    {
      "code": 6008,
      "name": "invalidMetadata",
      "msg": "Invalid Metadata"
    },
    {
      "code": 6009,
      "name": "creatorFeeTooHigh",
      "msg": "Creator fee too high"
    },
    {
      "code": 6010,
      "name": "feeCalculationError",
      "msg": "Platform fee calculation failed."
    },
    {
      "code": 6011,
      "name": "feeExceedsPrice",
      "msg": "Total fee exceeds the price amount."
    },
    {
      "code": 6012,
      "name": "invalidFeeShares",
      "msg": "Total fee shares must equal 100."
    },
    {
      "code": 6013,
      "name": "tooManyRecipients",
      "msg": "Too many platform fee recipients. Maximum allowed is 5."
    },
    {
      "code": 6014,
      "name": "recipientMismatch",
      "msg": "Recipient account does not match the expected address."
    },
    {
      "code": 6015,
      "name": "noPhasesAdded",
      "msg": "No phases have been added. Cannot mint."
    },
    {
      "code": 6016,
      "name": "invalidPhaseIndex",
      "msg": "Invalid phase index."
    },
    {
      "code": 6017,
      "name": "privatePhaseNoProof",
      "msg": "Private phase but no merkle proof provided"
    },
    {
      "code": 6018,
      "name": "merkleRootNotSet",
      "msg": "Merkle root not set for allow list mint"
    },
    {
      "code": 6019,
      "name": "merkleProofRequired",
      "msg": "Merkle proof required for allow list mint"
    },
    {
      "code": 6020,
      "name": "allowListPriceAndMaxClaimsRequired",
      "msg": "Allow list price and max claims are required for allow list mint"
    },
    {
      "code": 6021,
      "name": "invalidMerkleProof",
      "msg": "Invalid merkle proof"
    },
    {
      "code": 6022,
      "name": "exceededAllowListMaxClaims",
      "msg": "This wallet has exceeded allow list max_claims in the current phase"
    },
    {
      "code": 6023,
      "name": "phaseNotActive",
      "msg": "Phase not active"
    },
    {
      "code": 6024,
      "name": "phaseNotStarted",
      "msg": "Phase not yet started"
    },
    {
      "code": 6025,
      "name": "phaseAlreadyFinished",
      "msg": "Phase already finished"
    },
    {
      "code": 6026,
      "name": "exceededMaxMintsForPhase",
      "msg": "Exceeded max mints for this phase"
    },
    {
      "code": 6027,
      "name": "exceededWalletMaxMintsForPhase",
      "msg": "Exceeded wallet max mints for this phase"
    },
    {
      "code": 6028,
      "name": "exceededWalletMaxMintsForCollection",
      "msg": "Exceeded wallet max mints for the collection"
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
      "name": "editionsControls",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "editionsDeployment",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "maxMintsPerWallet",
            "type": "u64"
          },
          {
            "name": "cosignerProgramId",
            "type": "pubkey"
          },
          {
            "name": "platformFeePrimaryAdmin",
            "type": "pubkey"
          },
          {
            "name": "platformFeeSecondaryAdmin",
            "type": "pubkey"
          },
          {
            "name": "platformFeeValue",
            "type": "u64"
          },
          {
            "name": "isFeeFlat",
            "type": "bool"
          },
          {
            "name": "platformFeeRecipients",
            "type": {
              "array": [
                {
                  "defined": {
                    "name": "platformFeeRecipient"
                  }
                },
                5
              ]
            }
          },
          {
            "name": "phases",
            "type": {
              "vec": {
                "defined": {
                  "name": "phase"
                }
              }
            }
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                200
              ]
            }
          }
        ]
      }
    },
    {
      "name": "editionsDeployment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "maxNumberOfTokens",
            "type": "u64"
          },
          {
            "name": "numberOfTokensIssued",
            "type": "u64"
          },
          {
            "name": "cosignerProgramId",
            "type": "pubkey"
          },
          {
            "name": "groupMint",
            "type": "pubkey"
          },
          {
            "name": "group",
            "type": "pubkey"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "itemBaseName",
            "type": "string"
          },
          {
            "name": "itemBaseUri",
            "type": "string"
          },
          {
            "name": "itemNameIsTemplate",
            "type": "bool"
          },
          {
            "name": "itemUriIsTemplate",
            "type": "bool"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                98
              ]
            }
          }
        ]
      }
    },
    {
      "name": "initialiseControlInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "maxMintsPerWallet",
            "type": "u64"
          },
          {
            "name": "treasury",
            "type": "pubkey"
          },
          {
            "name": "maxNumberOfTokens",
            "type": "u64"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "collectionName",
            "type": "string"
          },
          {
            "name": "collectionUri",
            "type": "string"
          },
          {
            "name": "cosignerProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "royalties",
            "type": {
              "defined": {
                "name": "updateRoyaltiesArgs"
              }
            }
          },
          {
            "name": "extraMeta",
            "type": {
              "vec": {
                "defined": {
                  "name": "addMetadataArgs"
                }
              }
            }
          },
          {
            "name": "itemBaseUri",
            "type": "string"
          },
          {
            "name": "itemBaseName",
            "type": "string"
          },
          {
            "name": "platformFee",
            "type": {
              "defined": {
                "name": "updatePlatformFeeArgs"
              }
            }
          }
        ]
      }
    },
    {
      "name": "initialisePhaseInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceAmount",
            "type": "u64"
          },
          {
            "name": "priceToken",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "maxMintsPerWallet",
            "type": "u64"
          },
          {
            "name": "maxMintsTotal",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "merkleRoot",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          }
        ]
      }
    },
    {
      "name": "mintInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "phaseIndex",
            "type": "u32"
          },
          {
            "name": "merkleProof",
            "type": {
              "option": {
                "vec": {
                  "array": [
                    "u8",
                    32
                  ]
                }
              }
            }
          },
          {
            "name": "allowListPrice",
            "type": {
              "option": "u64"
            }
          },
          {
            "name": "allowListMaxClaims",
            "type": {
              "option": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "minterStats",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "wallet",
            "type": "pubkey"
          },
          {
            "name": "mintCount",
            "type": "u64"
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                50
              ]
            }
          }
        ]
      }
    },
    {
      "name": "phase",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "priceAmount",
            "type": "u64"
          },
          {
            "name": "priceToken",
            "type": "pubkey"
          },
          {
            "name": "startTime",
            "type": "i64"
          },
          {
            "name": "active",
            "type": "bool"
          },
          {
            "name": "maxMintsPerWallet",
            "type": "u64"
          },
          {
            "name": "maxMintsTotal",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "i64"
          },
          {
            "name": "currentMints",
            "type": "u64"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "merkleRoot",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "padding",
            "type": {
              "array": [
                "u8",
                200
              ]
            }
          }
        ]
      }
    },
    {
      "name": "platformFeeRecipient",
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
      "name": "updatePlatformFeeArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "platformFeeValue",
            "type": "u64"
          },
          {
            "name": "recipients",
            "type": {
              "vec": {
                "defined": {
                  "name": "platformFeeRecipient"
                }
              }
            }
          },
          {
            "name": "isFeeFlat",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "updatePlatformFeeSecondaryAdminInput",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "newAdmin",
            "type": "pubkey"
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
