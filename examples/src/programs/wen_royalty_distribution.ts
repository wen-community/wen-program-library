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
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateDistribution",
      "docs": [
        "Update royalty amount for creators a distribution account."
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
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
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAddress",
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
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
          "name": "distributionAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAddress",
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
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "data",
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
            "type": "publicKey"
          },
          {
            "name": "pct",
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
            "type": "publicKey"
          },
          {
            "name": "amount",
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
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateDistribution",
      "docs": [
        "Update royalty amount for creators a distribution account."
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
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
          "name": "distribution",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "distributionAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAddress",
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
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
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
          "name": "distributionAddress",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payerAddress",
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
            "name": "collection",
            "type": "publicKey"
          },
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "data",
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
            "type": "publicKey"
          },
          {
            "name": "pct",
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
            "type": "publicKey"
          },
          {
            "name": "amount",
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
    }
  ]
};
