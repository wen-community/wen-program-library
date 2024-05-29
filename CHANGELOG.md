# 0.4.0 (2024-05-28)

### Breaking Changes
* Removed the payer account from thaw/burn mint account instructions ([28761be](https://github.com/wen-community/wen-program-library/pull/77/commits/28761be18bac01782f92dbe78da69c1f7598ea37))
* Removed the neccesity of rent account for program instructions ([d657ff](https://github.com/wen-community/wen-program-library/pull/77/commits/d657ff2f2a62fbf486ba8f91217deaf0fac17f1f))
* Added `payment_mint` for distribution program's update and claim instructions ([e6b45cb](https://github.com/wen-community/wen-program-library/pull/77/commits/e6b45cbd11162d26c3e7a54d30b74e64be6c4058))
* Payment Mint token accounts are now optional if the payment mint is SOL (Pubkey::default) ([8779bc5](https://github.com/wen-community/wen-program-library/pull/77/commits/8779bc53e1b76a413d819be77332f83338c37dc3))


### Bug Fixes

* add yarn lock ([b8fa0b6](https://github.com/wen-community/wen-program-library/commit/b8fa0b65aee79fbb980a4a1ba096b6578a54ea50))
* Remove mutable requirement over mint and authority accounts for wen new standard program instructions ([27e6390](https://github.com/wen-community/wen-program-library/pull/77/commits/27e63904b02902f219827d6b3f5042a85f02e61f))


### Features

* added a test sale program demoing wen-distribution-program features with tests ([25772a0](https://github.com/wen-community/wen-program-library/commit/25772a0e4fcad4515d6225b2ff47a12ad939404c))
* complete implementing remove mint from group ([cc42ff6](https://github.com/wen-community/wen-program-library/commit/cc42ff65eeb0add98d4000b0bda9a79b270912df))
* use conventional-changelog to keep a change log between releases. resolves [#73](https://github.com/wen-community/wen-program-library/issues/73) ([e73ba50](https://github.com/wen-community/wen-program-library/commit/e73ba509299f2a705aa817d8ee36e556f95f02e4))
* use kinobi to generate js and rust sdks ([#86](https://github.com/wen-community/wen-program-library/issues/86)) ([27e97a3](https://github.com/wen-community/wen-program-library/commit/27e97a37350562bd267956c170cabd19fb9a0a43))