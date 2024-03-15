export type WenNewStandard = {
  "version": "0.3.1-alpha",
  "name": "wen_new_standard",
  "instructions": [
    {
      "name": "initManagerAccount",
      "docs": [
        "Init manager account"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "manager",
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
      "name": "createGroupAccount",
      "docs": [
        "Token group instructions",
        "create group"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
            "defined": "CreateGroupAccountArgs"
          }
        }
      ]
    },
    {
      "name": "updateGroupAccount",
      "docs": [
        "update group"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateGroupAccountArgs"
          }
        }
      ]
    },
    {
      "name": "createMintAccount",
      "docs": [
        "create mint"
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
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
            "defined": "CreateMintAccountArgs"
          }
        }
      ]
    },
    {
      "name": "addMintToGroup",
      "docs": [
        "add mint to group"
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
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addRoyalties",
      "docs": [
        "add royalties to mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateRoyaltiesArgs"
          }
        }
      ]
    },
    {
      "name": "modifyRoyalties",
      "docs": [
        "modify royalties of mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateRoyaltiesArgs"
          }
        }
      ]
    },
    {
      "name": "addMetadata",
      "docs": [
        "add additional metadata to mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "vec": {
              "defined": "AddMetadataArgs"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "vec": {
              "defined": "RemoveMetadataArgs"
            }
          }
        }
      ]
    },
    {
      "name": "freezeMintAccount",
      "docs": [
        "freeze mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "thawMintAccount",
      "docs": [
        "thaw mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burnMintAccount",
      "docs": [
        "burn mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "execute",
      "docs": [
        "Royalty distribution + enforcement instructions",
        "validate transfer"
      ],
      "accounts": [
        {
          "name": "sourceAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerDelegate",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": false,
          "isSigner": false
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
      "name": "approveTransfer",
      "docs": [
        "approve transfer"
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
          "name": "approveAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
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
        },
        {
          "name": "distributionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "buyAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
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
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The associated mint, used to counter spoofing to be sure that group",
              "belongs to a particular mint"
            ],
            "type": "publicKey"
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
            "type": "publicKey"
          },
          {
            "name": "group",
            "docs": [
              "The pubkey of the `TokenGroup`"
            ],
            "type": "publicKey"
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
    }
  ],
  "types": [
    {
      "name": "CreateGroupAccountArgs",
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
      "name": "UpdateGroupAccountArgs",
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
      "name": "CreateMintAccountArgs",
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
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "AddMetadataArgs",
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
      "name": "RemoveMetadataArgs",
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
      "name": "CreatorWithShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateRoyaltiesArgs",
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
                "defined": "CreatorWithShare"
              }
            }
          }
        ]
      }
    },
    {
      "name": "MintErrors",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidFreezeAuthority"
          },
          {
            "name": "InvalidDelegateAuthority"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SizeExceedsMaxSize",
      "msg": "Collection size exceeds max size."
    },
    {
      "code": 6001,
      "name": "MaxSizeBelowCurrentSize",
      "msg": "Max size cannot be reduced below current size."
    },
    {
      "code": 6002,
      "name": "CreatorShareInvalid",
      "msg": "Creators shares must add up to 100."
    },
    {
      "code": 6003,
      "name": "MissingApproveAccount",
      "msg": "Missing approve account."
    },
    {
      "code": 6004,
      "name": "ExpiredApproveAccount",
      "msg": "Approve account has expired."
    },
    {
      "code": 6005,
      "name": "InvalidField",
      "msg": "Invalid field. You cannot use a public key as a field."
    },
    {
      "code": 6006,
      "name": "CreatorAddressInvalid",
      "msg": "The Address you provided is invalid. Please provide a valid address."
    },
    {
      "code": 6007,
      "name": "RoyaltyBasisPointsInvalid",
      "msg": "Royalty basis points must be less than or equal to 10000."
    }
  ]
};

export const IDL: WenNewStandard = {
  "version": "0.3.1-alpha",
  "name": "wen_new_standard",
  "instructions": [
    {
      "name": "initManagerAccount",
      "docs": [
        "Init manager account"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "manager",
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
      "name": "createGroupAccount",
      "docs": [
        "Token group instructions",
        "create group"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
            "defined": "CreateGroupAccountArgs"
          }
        }
      ]
    },
    {
      "name": "updateGroupAccount",
      "docs": [
        "update group"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateGroupAccountArgs"
          }
        }
      ]
    },
    {
      "name": "createMintAccount",
      "docs": [
        "create mint"
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
          "name": "receiver",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
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
            "defined": "CreateMintAccountArgs"
          }
        }
      ]
    },
    {
      "name": "addMintToGroup",
      "docs": [
        "add mint to group"
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
          "name": "group",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "member",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "addRoyalties",
      "docs": [
        "add royalties to mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateRoyaltiesArgs"
          }
        }
      ]
    },
    {
      "name": "modifyRoyalties",
      "docs": [
        "modify royalties of mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "defined": "UpdateRoyaltiesArgs"
          }
        }
      ]
    },
    {
      "name": "addMetadata",
      "docs": [
        "add additional metadata to mint"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "vec": {
              "defined": "AddMetadataArgs"
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
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
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
            "vec": {
              "defined": "RemoveMetadataArgs"
            }
          }
        }
      ]
    },
    {
      "name": "freezeMintAccount",
      "docs": [
        "freeze mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "thawMintAccount",
      "docs": [
        "thaw mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "delegateAuthority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "burnMintAccount",
      "docs": [
        "burn mint"
      ],
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "mint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mintTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "manager",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "execute",
      "docs": [
        "Royalty distribution + enforcement instructions",
        "validate transfer"
      ],
      "accounts": [
        {
          "name": "sourceAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "destinationAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "ownerDelegate",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "extraMetasAccount",
          "isMut": false,
          "isSigner": false
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
      "name": "approveTransfer",
      "docs": [
        "approve transfer"
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
          "name": "approveAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "paymentMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "distributionTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authorityTokenAccount",
          "isMut": true,
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
        },
        {
          "name": "distributionProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "buyAmount",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
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
            "type": "publicKey"
          },
          {
            "name": "mint",
            "docs": [
              "The associated mint, used to counter spoofing to be sure that group",
              "belongs to a particular mint"
            ],
            "type": "publicKey"
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
            "type": "publicKey"
          },
          {
            "name": "group",
            "docs": [
              "The pubkey of the `TokenGroup`"
            ],
            "type": "publicKey"
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
    }
  ],
  "types": [
    {
      "name": "CreateGroupAccountArgs",
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
      "name": "UpdateGroupAccountArgs",
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
      "name": "CreateMintAccountArgs",
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
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "AddMetadataArgs",
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
      "name": "RemoveMetadataArgs",
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
      "name": "CreatorWithShare",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "share",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "UpdateRoyaltiesArgs",
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
                "defined": "CreatorWithShare"
              }
            }
          }
        ]
      }
    },
    {
      "name": "MintErrors",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "InvalidFreezeAuthority"
          },
          {
            "name": "InvalidDelegateAuthority"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "SizeExceedsMaxSize",
      "msg": "Collection size exceeds max size."
    },
    {
      "code": 6001,
      "name": "MaxSizeBelowCurrentSize",
      "msg": "Max size cannot be reduced below current size."
    },
    {
      "code": 6002,
      "name": "CreatorShareInvalid",
      "msg": "Creators shares must add up to 100."
    },
    {
      "code": 6003,
      "name": "MissingApproveAccount",
      "msg": "Missing approve account."
    },
    {
      "code": 6004,
      "name": "ExpiredApproveAccount",
      "msg": "Approve account has expired."
    },
    {
      "code": 6005,
      "name": "InvalidField",
      "msg": "Invalid field. You cannot use a public key as a field."
    },
    {
      "code": 6006,
      "name": "CreatorAddressInvalid",
      "msg": "The Address you provided is invalid. Please provide a valid address."
    },
    {
      "code": 6007,
      "name": "RoyaltyBasisPointsInvalid",
      "msg": "Royalty basis points must be less than or equal to 10000."
    }
  ]
};
