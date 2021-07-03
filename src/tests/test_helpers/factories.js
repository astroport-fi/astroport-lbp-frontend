export function buildPairAssetInfo({
  nativeToken,
  tokenContractAddr,
  startWeight = "2",
  endWeight = "60"
}) {
  let info;

  if(nativeToken) {
    info = {
      native_token: {
        denom: nativeToken
      }
    }
  } else {
    info = {
      token: {
        contract_addr: tokenContractAddr
      }
    }
  }

  return {
    info,
    start_weight: startWeight,
    end_weight: endWeight
  };
};

// Can provide full nativeTokenInfo/tokenContractInfo objects
// (e.g. via buildPairAssetInfo), or one will be built from
// nativeToken/tokenContractAddr, both of which are optional with defaults
export function buildPair({
  nativeTokenInfo,
  nativeToken = 'uusd',

  tokenContractInfo,
  tokenContractAddr = 'terra-token-addr',

  contractAddr = 'terra-pair-addr',
  liquidityTokenAddr = 'terra-pair-liquidity-token-addr',
  ownerAddr = 'terra-pair-owner-addr',
  startTime,
  endTime
} = {}) {
  if(nativeTokenInfo === undefined) {
    nativeTokenInfo = buildPairAssetInfo({ nativeToken })
  }

  if(tokenContractInfo === undefined) {
    tokenContractInfo = buildPairAssetInfo({ tokenContractAddr, startWeight: "98", endWeight: "40" })
  }

  const assetInfos = [
    nativeTokenInfo,
    tokenContractInfo
  ];

  // Randomly swap the asset order to introduce some entropy
  // since we aren't guaranteed asset order in the real world
  if(Math.floor(Math.random() * 2) === 1) {
    assetInfos.reverse();
  }

  if(startTime === undefined) {
    startTime = Math.floor((new Date()).getTime() / 1000)
  }

  if(endTime === undefined) {
    endTime = startTime + 3 * 24 * 60 * 60 // 3 days later
  }

  return {
    asset_infos: assetInfos,
    contract_addr: contractAddr,
    start_time: startTime,
    end_time: endTime,
    liquidity_token: liquidityTokenAddr,
    owner: ownerAddr
  };
}
