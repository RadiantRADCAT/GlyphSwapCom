import { TokenType } from './types' // Assuming you have a types file

// ... (previous code)

function calculateSwapAmount(fromToken: TokenType, toToken: TokenType, amount: number): number {
  const ratio = toToken.totalSupply / fromToken.totalSupply
  const baseAmount = amount * ratio
  const feeAmount = baseAmount * (FEE_PERCENTAGE / 100)
  return baseAmount - feeAmount
}

// ... (rest of the component)