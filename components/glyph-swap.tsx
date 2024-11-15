"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Copy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'

type TokenType = {
  symbol: string;
  name: string;
  imageUrl: string;
  totalSupply: number;
};

type LiquidityPool = {
  [key: string]: number;
};

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtBhBPpGYwjUuksHmobgUNIo3rdEtsKULSUJMYvdb-iIOLY1aZieoN_Q1y_ZjVVSpRkA/exec'
const FEE_PERCENTAGE = 3
const SWAP_WALLET = 'YOUR_SWAP_WALLET_ADDRESS_HERE'
const DISCORD_URL = 'https://discord.gg/pwBMDDzWWG'

const TOKENS: Record<string, TokenType> = {
  RXD: { symbol: 'RXD', name: 'Radiant', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_33dd965b95d54dfe9af12ed99fe5c43a~mv2.png', totalSupply: 120000000 },
  RADCAT: { symbol: 'RADCAT', name: 'RadCat', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_c2c4b7bf64464273a2cf3e30d08a9692~mv2.png', totalSupply: 21000000 },
  FUGAZI: { symbol: 'FUGAZI', name: 'Fugazi', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_27b255b33ae74f2c9b7bb9a6c3cf9076~mv2.jpeg', totalSupply: 21000000 },
  PILIM: { symbol: 'PILIM', name: 'Pilim', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_42bf29bc4cff49a2b50d46599890ecd7~mv2.png', totalSupply: 100000000000 },
}

export default function GlyphSwap() {
  const [currentFromToken, setCurrentFromToken] = useState<TokenType>(TOKENS.RXD)
  const [currentToToken, setCurrentToToken] = useState<TokenType>(TOKENS.RADCAT)
  const [liquidityPool, setLiquidityPool] = useState<LiquidityPool>({})
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [showSwapResult, setShowSwapResult] = useState(false)
  const [estimatedAmount, setEstimatedAmount] = useState(0)
  const [transactionId, setTransactionId] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    fetchLiquidityPool()
  }, [])

  useEffect(() => {
    updateEstimatedAmount()
  }, [amount, currentFromToken, currentToToken])

  async function fetchLiquidityPool() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getLiquidityPool`)
      const data = await response.json()
      setLiquidityPool(data)
    } catch (error) {
      console.error('Error fetching liquidity pool:', error)
    }
  }

  function calculateSwapAmount(fromToken: TokenType, toToken: TokenType, amount: number): number {
    const ratio = toToken.totalSupply / fromToken.totalSupply
    const baseAmount = amount * ratio
    const feeAmount = baseAmount * (FEE_PERCENTAGE / 100)
    return baseAmount - feeAmount
  }

  function calculateMinimumInputAmount(fromToken: TokenType, toToken: TokenType): number {
    const ratio = toToken.totalSupply / fromToken.totalSupply
    const minAmountBeforeFee = ratio
    const minAmountWithFee = minAmountBeforeFee * (100 / (100 - FEE_PERCENTAGE))
    return minAmountWithFee
  }

  function updateEstimatedAmount() {
    const amountValue = parseFloat(amount)
    if (!isNaN(amountValue)) {
      const estimated = calculateSwapAmount(currentFromToken, currentToToken, amountValue)
      setEstimatedAmount(estimated)
    } else {
      setEstimatedAmount(0)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = {
      action: 'swap',
      tokenFrom: currentFromToken.symbol,
      tokenTo: currentToToken.symbol,
      amount: parseFloat(amount),
      receivingAmount: estimatedAmount,
      walletAddress: walletAddress,
      timestamp: new Date().toISOString()
    }

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      setShowSwapResult(true)
      // Update local liquidity pool data
      setLiquidityPool(prevPool => ({
        ...prevPool,
        [currentFromToken.symbol]: (prevPool[currentFromToken.symbol] || 0) + parseFloat(amount),
        [currentToToken.symbol]: (prevPool[currentToToken.symbol] || 0) - estimatedAmount
      }))
    } catch (error) {
      console.error('Error initiating swap:', error)
      alert('There was an error initiating the swap. Please try again.')
    }
  }

  function handleBack() {
    setShowSwapResult(false)
    setVerificationStatus(null)
    setTransactionId('')
    setAmount('')
    setWalletAddress('')
  }

  async function handleVerifyTransaction() {
    if (!transactionId) {
      alert('Please enter your transaction ID')
      return
    }

    const data = {
      action: 'verify',
      transactionId: transactionId,
      walletAddress: walletAddress,
      tokenFrom: currentFromToken.symbol,
      tokenTo: currentToToken.symbol,
      amount: amount,
      timestamp: new Date().toISOString()
    }

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      setVerificationStatus('success')
    } catch (error) {
      console.error('Error verifying transaction:', error)
      setVerificationStatus('error')
    }
  }

  const minAmount = calculateMinimumInputAmount(currentFromToken, currentToToken)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 bg-cover bg-center bg-fixed font-sans">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">GlyphSwap</CardTitle>
          <CardDescription className="text-center">Swap your tokens with ease</CardDescription>
        </CardHeader>
        <CardContent>
          {!showSwapResult ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/70">From</label>
                <Select
                  value={currentFromToken.symbol}
                  onValueChange={(value) => setCurrentFromToken(TOKENS[value as keyof typeof TOKENS])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image src={currentFromToken.imageUrl} alt={currentFromToken.symbol} width={24} height={24} className="rounded-full" />
                        <span>{currentFromToken.symbol}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TOKENS).map(token => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <Image src={token.imageUrl} alt={token.symbol} width={24} height={24} className="rounded-full" />
                          <span>{token.symbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium text-foreground/70">Amount</label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  required
                  className="bg-background/50"
                />
                <div className="text-xs text-muted-foreground">
                  Minimum input: {minAmount.toFixed(6)} {currentFromToken.symbol} (including {FEE_PERCENTAGE}% fee)
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground/70">To</label>
                <Select
                  value={currentToToken.symbol}
                  onValueChange={(value) => setCurrentToToken(TOKENS[value as keyof typeof TOKENS])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <div className="flex items-center gap-2">
                        <Image src={currentToToken.imageUrl} alt={currentToToken.symbol} width={24} height={24} className="rounded-full" />
                        <span>{currentToToken.symbol}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TOKENS).map(token => (
                      <SelectItem key={token.symbol} value={token.symbol}>
                        <div className="flex items-center gap-2">
                          <Image src={token.imageUrl} alt={token.symbol} width={24} height={24} className="rounded-full" />
                          <span>{token.symbol}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                Available liquidity: {(liquidityPool[currentToToken.symbol] || 0).toLocaleString()} {currentToToken.symbol}
              </div>

              <div className="space-y-2">
                <label htmlFor="wallet" className="text-sm font-medium text-foreground/70">Wallet Address</label>
                <Input
                  id="wallet"
                  type="text"
                  placeholder="Enter your wallet address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>

              {estimatedAmount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Estimated amount: {estimatedAmount.toFixed(6)} {currentToToken.symbol}
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Swap Tokens</Button>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Swap Initiated</h2>
              <p>You are swapping {amount} {currentFromToken.symbol} for approximately {estimatedAmount.toFixed(6)} {currentToToken.symbol}.</p>
              <p>Please send {amount} {currentFromToken.symbol} to the following address:</p>
              <div className="bg-muted p-2 rounded flex items-center justify-between">
                <span className="text-sm break-all">{SWAP_WALLET}</span>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(SWAP_WALLET)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                <Image src={`/placeholder.svg?height=150&width=150&text=${SWAP_WALLET}`} alt="QR Code" width={150} height={150} />
              </div>
              <p>After sending, please enter your transaction ID to verify the swap:</p>
              <Input 
                type="text" 
                placeholder="Enter transaction ID" 
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="bg-background/50"
              />
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleVerifyTransaction}>Verify Transaction</Button>
              {verificationStatus === 'success' && (
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    Your transaction has been verified successfully.
                  </AlertDescription>
                </Alert>
              )}
              {verificationStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    There was an error verifying your transaction. Please try again or contact support.
                  </AlertDescription>
                </Alert>
              )}
              <Button variant="outline" className="w-full" onClick={handleBack}>Back to Swap</Button>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="block text-center text-primary hover:underline">
                Need help? Join our Discord
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}