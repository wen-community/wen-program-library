export type WenRoyaltyDistribution = {
  "version": "0.0.1-alpha",
  "name": "wen_royalty_distribution",
  "instructions": [
    {
      "name": "initializeDistribution",
      "docs": [
        "Initializes a new distribution account."
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateDistribution",
      "docs": [
        "Update royalty amount for creators a distribution account."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateDistributionArgs"
          }
        }
      ]
    },
    {
      "name": "claimDistribution",
      "docs": [
        "Claim royalties from a distribution account."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
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
            "type": "publicKey"
          },
          {
            "name": "paymentMint",
            "docs": [
              "payment mint for the distribution account"
            ],
            "type": "publicKey"
          },
          {
            "name": "claimData",
            "type": {
              "vec": {
                "defined": "Creator"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CreatorShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "docs": [
              "creator address"
            ],
            "type": "publicKey"
          },
          {
            "name": "pct",
            "docs": [
              "creator share percentage"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateDistributionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "Creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "docs": [
              "creator address"
            ],
            "type": "publicKey"
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
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidGroupAuthority",
      "msg": "Invalid Group Authority for collection account"
    },
    {
      "code": 6001,
      "name": "InvalidCreatorPctAmount",
      "msg": "Invalid creator pct amount. Must add up to 100"
    },
    {
      "code": 6002,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ]
};

export const IDL: WenRoyaltyDistribution = {
  "version": "0.0.1-alpha",
  "name": "wen_royalty_distribution",
  "instructions": [
    {
      "name": "initializeDistribution",
      "docs": [
        "Initializes a new distribution account."
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "groupMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "publicKey"
        }
      ]
    },
    {
      "name": "updateDistribution",
      "docs": [
        "Update royalty amount for creators a distribution account."
      ],
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "args",
          "type": {
            "defined": "UpdateDistributionArgs"
          }
        }
      ]
    },
    {
      "name": "claimDistribution",
      "docs": [
        "Claim royalties from a distribution account."
      ],
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creatorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "paymentMint",
          "type": "publicKey"
        }
      ]
    }
  ],
  "accounts": [
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
            "type": "publicKey"
          },
          {
            "name": "paymentMint",
            "docs": [
              "payment mint for the distribution account"
            ],
            "type": "publicKey"
          },
          {
            "name": "claimData",
            "type": {
              "vec": {
                "defined": "Creator"
              }
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CreatorShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "docs": [
              "creator address"
            ],
            "type": "publicKey"
          },
          {
            "name": "pct",
            "docs": [
              "creator share percentage"
            ],
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateDistributionArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "paymentMint",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "Creator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "docs": [
              "creator address"
            ],
            "type": "publicKey"
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
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidGroupAuthority",
      "msg": "Invalid Group Authority for collection account"
    },
    {
      "code": 6001,
      "name": "InvalidCreatorPctAmount",
      "msg": "Invalid creator pct amount. Must add up to 100"
    },
    {
      "code": 6002,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    }
  ]
};
