"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Copy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Image from 'next/image'

type Token = {
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

const TOKENS: Record<string, Token> = {
  RXD: { symbol: 'RXD', name: 'Radiant', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_33dd965b95d54dfe9af12ed99fe5c43a~mv2.png', totalSupply: 120000000 },
  RADCAT: { symbol: 'RADCAT', name: 'RadCat', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_c2c4b7bf64464273a2cf3e30d08a9692~mv2.png', totalSupply: 21000000 },
  FUGAZI: { symbol: 'FUGAZI', name: 'Fugazi', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_27b255b33ae74f2c9b7bb9a6c3cf9076~mv2.jpeg', totalSupply: 21000000 },
  PILIM: { symbol: 'PILIM', name: 'Pilim', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_42bf29bc4cff49a2b50d46599890ecd7~mv2.png', totalSupply: 100000000000 },
}

export default function GlyphSwap() {
  const [currentFromToken, setCurrentFromToken] = useState(TOKENS.RXD)
  const [currentToToken, setCurrentToToken] = useState(TOKENS.RADCAT)
  const [liquidityPool, setLiquidityPool] = useState<LiquidityPool>({})
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [showSwapResult, setShowSwapResult] = useState(false)
  const [estimatedAmount, setEstimatedAmount] = useState(0)
  const [transactionId, setTransactionId] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | null>(null)

  const fetchLiquidityPool = useCallback(async () => {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getLiquidityPool`)
      const data = await response.json()
      setLiquidityPool(data)
    } catch (error) {
      console.error('Error fetching liquidity pool:', error)
    }
  }, [])

  useEffect(() => {
    fetchLiquidityPool()
  }, [fetchLiquidityPool])

  const calculateSwapAmount = useCallback((fromToken: Token, toToken: Token, amount: number): number => {
    const ratio = toToken.totalSupply / fromToken.totalSupply;
    const baseAmount = amount * ratio;
    const feeAmount = baseAmount * (FEE_PERCENTAGE / 100);
    return baseAmount - feeAmount;
  }, [])

  const calculateMinimumInputAmount = useCallback((fromToken: Token, toToken: Token): number => {
    const ratio = toToken.totalSupply / fromToken.totalSupply;
    const minAmountBeforeFee = ratio;
    const minAmountWithFee = minAmountBeforeFee * (100 / (100 - FEE_PERCENTAGE));
    return minAmountWithFee;
  }, [])

  const updateEstimatedAmount = useCallback(() => {
    const amountValue = parseFloat(amount)
    if (!isNaN(amountValue)) {
      const estimated = calculateSwapAmount(currentFromToken, currentToToken, amountValue)
      setEstimatedAmount(estimated)
    } else {
      setEstimatedAmount(0)
    }
  }, [amount, currentFromToken, currentToToken, calculateSwapAmount])

  useEffect(() => {
    updateEstimatedAmount()
  }, [updateEstimatedAmount])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
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
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      setShowSwapResult(true)
      setLiquidityPool(prevPool => ({
        ...prevPool,
        [currentFromToken.symbol]: (prevPool[currentFromToken.symbol] || 0) + parseFloat(amount),
        [currentToToken.symbol]: (prevPool[currentToToken.symbol] || 0) - estimatedAmount
      }))
    } catch (error) {
      console.error('Error initiating swap:', error)
      alert('There was an error initiating the swap. Please try again.')
    }
  }, [currentFromToken, currentToToken, amount, estimatedAmount, walletAddress])

  const handleBack = useCallback(() => {
    setShowSwapResult(false)
    setVerificationStatus(null)
    setTransactionId('')
    setAmount('')
    setWalletAddress('')
  }, [])

  const handleVerifyTransaction = useCallback(async () => {
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
  }, [transactionId, walletAddress, currentFromToken.symbol, currentToToken.symbol, amount])

  const minAmount = calculateMinimumInputAmount(currentFromToken, currentToToken)

  return (
    <div className="min-h-screen w-full bg-cover bg-center bg-fixed" 
         style={{backgroundImage: "url('https://static.wixstatic.com/media/c0fd9f_7a29e6d3a40f4821a14dbe8f93b9d069~mv2.jpg')"}}>
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <Image 
                src="https://static.wixstatic.com/media/c0fd9f_cfacf9e215804e3a8ad37a1f5e0d3f11~mv2.png" 
                alt="GlyphSwap Logo" 
                width={32} 
                height={32} 
              />
              <h1 className="text-2xl">
                Glyph<span className="italic">Swap</span>
              </h1>
            </div>
            <div className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
              Beta
            </div>
          </div>

          {!showSwapResult ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-600 text-lg mb-2">From</label>
                  <Select
                    value={currentFromToken.symbol}
                    onValueChange={(value) => setCurrentFromToken(TOKENS[value])}
                  >
                    <SelectTrigger className="w-full h-14 bg-white border border-gray-200">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Image src={currentFromToken.imageUrl} alt={currentFromToken.symbol} width={24} height={24} className="rounded-full" />
                          <span className="font-medium">{currentFromToken.symbol}</span>
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

                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="any"
                  required
                  className="h-14 bg-white border-gray-200 text-lg"
                />
                
                <div className="text-sm text-gray-500">
                  Minimum input: {minAmount.toFixed(6)} {currentFromToken.symbol} (including {FEE_PERCENTAGE}% fee)
                </div>

                <div>
                  <label className="block text-gray-600 text-lg mb-2">To</label>
                  <Select
                    value={currentToToken.symbol}
                    onValueChange={(value) => setCurrentToToken(TOKENS[value])}
                  >
                    <SelectTrigger className="w-full h-14 bg-white border border-gray-200">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <Image src={currentToToken.imageUrl} alt={currentToToken.symbol} width={24} height={24} className="rounded-full" />
                          <span className="font-medium">{currentToToken.symbol}</span>
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

                <div className="text-sm text-gray-500">
                  Available liquidity: {(liquidityPool[currentToToken.symbol] || 0).toLocaleString()} {currentToToken.symbol}
                </div>

                <div>
                  <label className="block text-gray-600 text-lg mb-2">Your Photonic Wallet Address</label>
                  <Input
                    type="text"
                    placeholder="Enter your wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    className="h-14 bg-white border-gray-200"
                  />
                </div>

                {estimatedAmount > 0 && (
                  <div className="text-sm text-gray-600">
                    Estimated amount: {estimatedAmount.toFixed(6)} {currentToToken.symbol}
                  </div>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-14 bg-[#F4B95F] hover:bg-[#E5AA50] text-white font-medium text-lg rounded-xl"
              >
                Swap Tokens
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Swap Initiated</h2>
              <p>You are swapping {amount} {currentFromToken.symbol} for approximately {estimatedAmount.toFixed(6)} {currentToToken.symbol}.</p>
              <p>Please send {amount} {currentFromToken.symbol} to the following address:</p>
              <div className="bg-gray-100 p-2 rounded flex items-center justify-between">
                <span className="text-sm break-all">{SWAP_WALLET}</span>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(SWAP_WALLET)}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy wallet address</span>
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
                className="h-14 bg-white border-gray-200"
              />
              <Button onClick={handleVerifyTransaction} className="w-full h-14 bg-[#F4B95F] hover:bg-[#E5AA50] text-white font-medium text-lg rounded-xl">
                Verify Transaction
              </Button>
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
              <Button variant="outline" onClick={handleBack} className="w-full h-14">Back to Swap</Button>
              <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="block text-center text-blue-500 hover:underline">
                Need help? Join our Discord
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}