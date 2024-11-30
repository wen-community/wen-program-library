/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/marketplace.json`.
 */
export type Marketplace = {
  "address": "Rarim7DMoD45z1o25QWPsWvTdFSSEdxaxriwWZLLTic",
  "metadata": {
    "name": "marketplace",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Base marketplace contracts on SVM for rarible"
  },
  "instructions": [
    {
      "name": "bid",
      "docs": [
        "initializer a new bid"
      ],
      "discriminator": [
        199,
        56,
        85,
        38,
        146,
        243,
        37,
        158
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_identifier",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "data.nonce"
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "initializer"
              }
            ]
          }
        },
        {
          "name": "initializerPaymentTa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "initializer"
              },
              {
                "kind": "account",
                "path": "paymentTokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "orderPaymentTa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "order"
              },
              {
                "kind": "account",
                "path": "paymentTokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "paymentMint",
          "writable": true
        },
        {
          "name": "paymentTokenProgram"
        },
        {
          "name": "nftMint"
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
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": {
            "defined": {
              "name": "bidData"
            }
          }
        }
      ]
    },
    {
      "name": "cancelBid",
      "docs": [
        "cancel a buy order"
      ],
      "discriminator": [
        40,
        243,
        190,
        217,
        208,
        253,
        86,
        206
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.nonce",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.market",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "initializer"
              }
            ]
          }
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_identifier",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "initializerPaymentTa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "initializer"
              },
              {
                "kind": "account",
                "path": "paymentTokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "orderPaymentTa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "order"
              },
              {
                "kind": "account",
                "path": "paymentTokenProgram"
              },
              {
                "kind": "account",
                "path": "paymentMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "paymentMint",
          "writable": true
        },
        {
          "name": "paymentTokenProgram"
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
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": []
    },
    {
      "name": "cancelListing",
      "docs": [
        "cancel a sell order"
      ],
      "discriminator": [
        41,
        183,
        50,
        232,
        230,
        233,
        157,
        70
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.nonce",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.market",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "initializer"
              }
            ]
          }
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_identifier",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "nftMint",
          "writable": true
        },
        {
          "name": "initializerNftTa",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "nftTokenProgram"
        },
        {
          "name": "nftProgram"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": []
    },
    {
      "name": "fillOrder",
      "docs": [
        "fill a listing"
      ],
      "discriminator": [
        232,
        122,
        115,
        25,
        199,
        143,
        136,
        162
      ],
      "accounts": [
        {
          "name": "taker",
          "writable": true,
          "signer": true
        },
        {
          "name": "maker",
          "writable": true
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_identifier",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "order.nonce",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.market",
                "account": "order"
              },
              {
                "kind": "account",
                "path": "order.owner",
                "account": "order"
              }
            ]
          }
        },
        {
          "name": "nftMint",
          "writable": true
        },
        {
          "name": "sellerNftTa",
          "writable": true
        },
        {
          "name": "buyerNftTa",
          "writable": true
        },
        {
          "name": "feeRecipient",
          "writable": true
        },
        {
          "name": "feeRecipientTa",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "nftTokenProgram"
        },
        {
          "name": "nftProgram"
        },
        {
          "name": "sellerPaymentTa",
          "writable": true
        },
        {
          "name": "buyerPaymentTa",
          "writable": true
        },
        {
          "name": "paymentMint",
          "writable": true
        },
        {
          "name": "paymentTokenProgram"
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
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
      "name": "initMarket",
      "docs": [
        "initializer a new market"
      ],
      "discriminator": [
        33,
        253,
        15,
        116,
        89,
        25,
        127,
        236
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "marketIdentifier"
        },
        {
          "name": "market",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "marketIdentifier"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": {
              "name": "initMarketParams"
            }
          }
        }
      ]
    },
    {
      "name": "list",
      "docs": [
        "initializer a new listing"
      ],
      "discriminator": [
        54,
        174,
        193,
        67,
        17,
        41,
        132,
        38
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "market.market_identifier",
                "account": "market"
              }
            ]
          }
        },
        {
          "name": "order",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  111,
                  114,
                  100,
                  101,
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "data.nonce"
              },
              {
                "kind": "account",
                "path": "market"
              },
              {
                "kind": "account",
                "path": "initializer"
              }
            ]
          }
        },
        {
          "name": "nftMint"
        },
        {
          "name": "initializerNftTa",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "initializer"
              },
              {
                "kind": "account",
                "path": "nftTokenProgram"
              },
              {
                "kind": "account",
                "path": "nftMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "sysvarInstructions",
          "address": "Sysvar1nstructions1111111111111111111111111"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "nftTokenProgram"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "nftProgram"
        },
        {
          "name": "eventAuthority",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  95,
                  95,
                  101,
                  118,
                  101,
                  110,
                  116,
                  95,
                  97,
                  117,
                  116,
                  104,
                  111,
                  114,
                  105,
                  116,
                  121
                ]
              }
            ]
          }
        },
        {
          "name": "program"
        }
      ],
      "args": [
        {
          "name": "data",
          "type": {
            "defined": {
              "name": "listData"
            }
          }
        }
      ]
    },
    {
      "name": "verifyMint",
      "docs": [
        "initializer a new market"
      ],
      "discriminator": [
        57,
        93,
        52,
        66,
        75,
        249,
        244,
        143
      ],
      "accounts": [
        {
          "name": "initializer",
          "writable": true,
          "signer": true
        },
        {
          "name": "market"
        },
        {
          "name": "nftMint"
        },
        {
          "name": "verification",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  101,
                  114,
                  105,
                  102,
                  105,
                  99,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "nftMint"
              },
              {
                "kind": "account",
                "path": "market"
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
    }
  ],
  "accounts": [
    {
      "name": "market",
      "discriminator": [
        219,
        190,
        213,
        55,
        0,
        227,
        198,
        154
      ]
    },
    {
      "name": "mintVerification",
      "discriminator": [
        152,
        183,
        224,
        35,
        143,
        133,
        78,
        176
      ]
    },
    {
      "name": "order",
      "discriminator": [
        134,
        173,
        223,
        185,
        77,
        86,
        28,
        51
      ]
    }
  ],
  "events": [
    {
      "name": "marketEditEvent",
      "discriminator": [
        160,
        230,
        206,
        202,
        154,
        28,
        249,
        246
      ]
    },
    {
      "name": "orderEditEvent",
      "discriminator": [
        155,
        223,
        223,
        45,
        200,
        107,
        177,
        149
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "wrongAccount",
      "msg": "Account passed in incorrectly"
    },
    {
      "code": 6001,
      "name": "insufficientOrderSize",
      "msg": "Order too small"
    },
    {
      "code": 6002,
      "name": "amountOverflow",
      "msg": "Amount overflow"
    },
    {
      "code": 6003,
      "name": "amountUnderflow",
      "msg": "Amount underflow"
    },
    {
      "code": 6004,
      "name": "unsupportedNft",
      "msg": "Unsupported NFT Type"
    },
    {
      "code": 6005,
      "name": "invalidNft",
      "msg": "Invalid NFT for Market"
    }
  ],
  "types": [
    {
      "name": "bidData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "size",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "initMarketParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "feeRecipient",
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "listData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nonce",
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "type": "pubkey"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "size",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "market",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "market account version, used to conditionally parse accounts if changes are made to the struct"
            ],
            "type": "u8"
          },
          {
            "name": "marketIdentifier",
            "docs": [
              "identifying of the index to which the NFTs belong to (WNS Collection, Metaplex collection, separate hash)"
            ],
            "type": "pubkey"
          },
          {
            "name": "initializer",
            "docs": [
              "initializer of the market - can edit and close the market, admin key"
            ],
            "type": "pubkey"
          },
          {
            "name": "state",
            "docs": [
              "state representing the market - open/closed"
            ],
            "type": "u8"
          },
          {
            "name": "feeRecipient",
            "docs": [
              "address that should receive market fees"
            ],
            "type": "pubkey"
          },
          {
            "name": "feeBps",
            "docs": [
              "fee basis points"
            ],
            "type": "u64"
          },
          {
            "name": "reserve",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                512
              ]
            }
          }
        ]
      }
    },
    {
      "name": "marketEditEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "editType",
            "type": "u8"
          },
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "marketIdentifier",
            "type": "string"
          },
          {
            "name": "initializer",
            "type": "string"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "feeRecipient",
            "type": "string"
          },
          {
            "name": "feeBps",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "mintVerification",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "verified",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "order",
      "docs": [
        "order account - each listing has one order account"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "version",
            "docs": [
              "order account version"
            ],
            "type": "u8"
          },
          {
            "name": "nonce",
            "docs": [
              "nonce for uniqueness"
            ],
            "type": "pubkey"
          },
          {
            "name": "market",
            "docs": [
              "market to which the order belongs to, must be init'd"
            ],
            "type": "pubkey"
          },
          {
            "name": "owner",
            "docs": [
              "owner of the order account"
            ],
            "type": "pubkey"
          },
          {
            "name": "side",
            "docs": [
              "type of order - buy/sell"
            ],
            "type": "u8"
          },
          {
            "name": "size",
            "docs": [
              "number of bids order is making",
              "always for 1 for sell"
            ],
            "type": "u64"
          },
          {
            "name": "price",
            "docs": [
              "bid amount in lamports"
            ],
            "type": "u64"
          },
          {
            "name": "state",
            "docs": [
              "order state - ready/partial/closed"
            ],
            "type": "u8"
          },
          {
            "name": "initTime",
            "docs": [
              "order account creation time"
            ],
            "type": "i64"
          },
          {
            "name": "lastEditTime",
            "docs": [
              "last time the order was edited"
            ],
            "type": "i64"
          },
          {
            "name": "nftMint",
            "docs": [
              "nft mint in case order is a sell order"
            ],
            "type": "pubkey"
          },
          {
            "name": "paymentMint",
            "docs": [
              "mint for the payment, default pubkey if SOL"
            ],
            "type": "pubkey"
          },
          {
            "name": "feesOn",
            "docs": [
              "fees on for this order"
            ],
            "type": "bool"
          },
          {
            "name": "reserve0",
            "docs": [
              "reserved space for future changes split up due to serialization constraints"
            ],
            "type": {
              "array": [
                "u8",
                256
              ]
            }
          },
          {
            "name": "reserve1",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                128
              ]
            }
          },
          {
            "name": "reserve2",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                64
              ]
            }
          },
          {
            "name": "reserve3",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                30
              ]
            }
          },
          {
            "name": "reserve4",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                30
              ]
            }
          },
          {
            "name": "reserve5",
            "docs": [
              "reserved space for future changes"
            ],
            "type": {
              "array": [
                "u8",
                3
              ]
            }
          }
        ]
      }
    },
    {
      "name": "orderEditEvent",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "editType",
            "type": "u8"
          },
          {
            "name": "address",
            "type": "string"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "string"
          },
          {
            "name": "market",
            "type": "string"
          },
          {
            "name": "owner",
            "type": "string"
          },
          {
            "name": "side",
            "type": "u8"
          },
          {
            "name": "size",
            "type": "u64"
          },
          {
            "name": "price",
            "type": "u64"
          },
          {
            "name": "state",
            "type": "u8"
          },
          {
            "name": "initTime",
            "type": "i64"
          },
          {
            "name": "lastEditTime",
            "type": "i64"
          },
          {
            "name": "nftMint",
            "type": "string"
          },
          {
            "name": "paymentMint",
            "type": "string"
          },
          {
            "name": "marketIdentifier",
            "type": "string"
          }
        ]
      }
    }
  ]
};
