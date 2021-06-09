import { saleAssetFromPair } from '../../helpers/asset_pairs'

describe('saleAssetFromPair', () => {
  const token = {
    info: {
      token: {}
    }
  };

  const nativeToken = {
    info: {
      native_token: {}
    }
  };

  it("returns first asset when it's the token", () => {
    const pair = [
      token,
      nativeToken
    ]

    expect(saleAssetFromPair(pair)).toEqual(token);
  });

  it("returns second asset when it's the token", () => {
    const pair = [
      nativeToken,
      token
    ]

    expect(saleAssetFromPair(pair)).toEqual(token);
  });
});