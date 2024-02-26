import { getQueryVariable } from '../../../../lib/spCoin/utils'
import { fetchBigIntBalance, fetchStringBalance } from '../../../../lib/wagmi/fetchBalance'
import { balanceOf } from '../../../../lib/ethers/providers/alchemy'
import { getURLParams } from '../../../lib/getURLParams'

export async function GET(req: Request) {
  const params = getURLParams(req.url);
  const address  = getQueryVariable(params, "walletAddress")
  const token    = getQueryVariable(params, "tokenAddress")
  const chainId  = getQueryVariable(params, "chainId")

  const wagmiBalance = await fetchStringBalance(address, token, chainId)

  const retBalanceOf = balanceOf(address, token)
  console.log("Wagmi BalanceOf = "+wagmiBalance)

  console.log("Wagmi BalanceOf = " + )
  return new Response(JSON.stringify(wagmiBalance))
}