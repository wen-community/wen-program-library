/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/rarible_editions.json`.
 */
export type RaribleEditions = {
  "address": "Rari9ftBd6vFdtpn8TDLwN2ze24KKkM5MLEETNiBMNn",
  "metadata": {
    "name": "raribleEditions",
    "version": "0.2.1",
    "spec": "0.1.0",
    "description": "Created with Anchor",
    "repository": "https://github.com/rarible/eclipse-program-library"
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
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "editions_deployment.symbol",
                "account": "editionsDeployment"
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
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
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
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "editions_deployment.symbol",
                "account": "editionsDeployment"
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
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint",
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
      "name": "initialise",
      "discriminator": [
        162,
        198,
        118,
        235,
        215,
        247,
        25,
        118
      ],
      "accounts": [
        {
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "input.symbol"
              }
            ]
          }
        },
        {
          "name": "hashlist",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  115,
                  104,
                  108,
                  105,
                  115,
                  116
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
          "writable": true
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
        }
      ],
      "args": [
        {
          "name": "input",
          "type": {
            "defined": {
              "name": "initialiseInput"
            }
          }
        }
      ]
    },
    {
      "name": "mint",
      "discriminator": [
        51,
        57,
        225,
        47,
        182,
        146,
        137,
        166
      ],
      "accounts": [
        {
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "editions_deployment.symbol",
                "account": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "hashlist",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  115,
                  104,
                  108,
                  105,
                  115,
                  116
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
          "name": "hashlistMarker",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  104,
                  97,
                  115,
                  104,
                  108,
                  105,
                  115,
                  116,
                  95,
                  109,
                  97,
                  114,
                  107,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "editionsDeployment"
              },
              {
                "kind": "account",
                "path": "mint"
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
          "name": "signer",
          "writable": true,
          "signer": true
        },
        {
          "name": "minter",
          "writable": true
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
          "name": "tokenAccount",
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
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "editions_deployment.symbol",
                "account": "editionsDeployment"
              }
            ]
          }
        },
        {
          "name": "signer",
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
          "name": "editionsDeployment",
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
                  100,
                  101,
                  112,
                  108,
                  111,
                  121,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "editions_deployment.symbol",
                "account": "editionsDeployment"
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
          "name": "signer",
          "writable": true,
          "signer": true
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
            "vec": {
              "defined": {
                "name": "removeMetadataArgs"
              }
            }
          }
        }
      ]
    }
  ],
  "accounts": [
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
      "name": "hashlist",
      "discriminator": [
        187,
        203,
        134,
        6,
        43,
        198,
        120,
        186
      ]
    },
    {
      "name": "hashlistMarker",
      "discriminator": [
        55,
        46,
        160,
        53,
        239,
        41,
        223,
        50
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
    },
    {
      "code": 6008,
      "name": "platformFeeBasisPointsInvalid",
      "msg": "Platform fee basis points must be less than or equal to 10000."
    },
    {
      "code": 6009,
      "name": "recipientShareInvalid",
      "msg": "Recipient shares must add up to 100."
    },
    {
      "code": 6010,
      "name": "reservedField",
      "msg": "The provided field is invalid or reserved."
    },
    {
      "code": 6011,
      "name": "invalidNumberOfRecipients",
      "msg": "Invalid number of platform fee recipients. Exactly 5 recipients are required."
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
      "name": "hashlist",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "deployment",
            "type": "pubkey"
          },
          {
            "name": "issues",
            "type": {
              "vec": {
                "defined": {
                  "name": "mintAndOrder"
                }
              }
            }
          }
        ]
      }
    },
    {
      "name": "hashlistMarker",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "editionsDeployment",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "initialiseInput",
      "type": {
        "kind": "struct",
        "fields": [
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
            "name": "maxNumberOfTokens",
            "type": "u64"
          },
          {
            "name": "creatorCosignProgramId",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "itemBaseUri",
            "type": "string"
          },
          {
            "name": "itemBaseName",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "mintAndOrder",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "order",
            "type": "u64"
          }
        ]
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
