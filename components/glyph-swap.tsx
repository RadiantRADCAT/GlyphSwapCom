"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Copy, ChevronDown, ArrowRight, Loader2 } from 'lucide-react'
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
  const [isLoading, setIsLoading] = useState(false)

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
    const ratio = toToken.totalSupply / fromToken.totalSupply
    const baseAmount = amount * ratio
    const feeAmount = baseAmount * (FEE_PERCENTAGE / 100)
    return baseAmount - feeAmount
  }, [])

  const calculateMinimumInputAmount = useCallback((fromToken: Token, toToken: Token): number => {
    const ratio = toToken.totalSupply / fromToken.totalSupply
    const minAmountBeforeFee = ratio
    const minAmountWithFee = minAmountBeforeFee * (100 / (100 - FEE_PERCENTAGE))
    return minAmountWithFee
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
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
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

    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
    }
  }, [transactionId, walletAddress, currentFromToken.symbol, currentToToken.symbol, amount])

  const minAmount = calculateMinimumInputAmount(currentFromToken, currentToToken)

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Image 
              src="https://static.wixstatic.com/media/c0fd9f_cfacf9e215804e3a8ad37a1f5e0d3f11~mv2.png" 
              alt="GlyphSwap Logo" 
              width={40} 
              height={40} 
              className="rounded-full"
            />
            <h1 className="text-3xl font-bold text-white">
              Glyph<span className="text-yellow-400">Swap</span>
            </h1>
          </div>
          <span className="px-3 py-1 text-xs font-semibold text-yellow-400 bg-yellow-400/20 rounded-full border border-yellow-400/50">
            Beta
          </span>
        </div>

        <AnimatePresence mode="wait">
          {!showSwapResult ? (
            <motion.form
              key="swap-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-white text-lg mb-2 block">From</label>
                  <Select
                    value={currentFromToken.symbol}
                    onValueChange={(value) => setCurrentFromToken(TOKENS[value])}
                  >
                    <SelectTrigger className="w-full h-16 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                      <SelectValue>
                        <div className="flex items-center gap-3">
                          <Image 
                            src={currentFromToken.imageUrl} 
                            alt={currentFromToken.symbol} 
                            width={32} 
                            height={32} 
                            className="rounded-full"
                          />
                          <span className="text-lg">{currentFromToken.symbol}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.values(TOKENS).map(token => (
                        <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-gray-700">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={token.imageUrl} 
                              alt={token.symbol} 
                              width={32} 
                              height={32} 
                              className="rounded-full"
                            />
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
                  className="h-16 bg-white/5 border-white/10 text-white text-lg placeholder-white/50 focus:ring-yellow-400 focus:border-yellow-400"
                />
                
                <div className="text-sm text-yellow-400/80">
                  Minimum input: {minAmount.toFixed(6)} {currentFromToken.symbol} (including {FEE_PERCENTAGE}% fee)
                </div>

                <div className="relative">
                  <label className="text-white text-lg mb-2 block">To</label>
                  <Select
                    value={currentToToken.symbol}
                    onValueChange={(value) => setCurrentToToken(TOKENS[value])}
                  >
                    <SelectTrigger className="w-full h-16 bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                      <SelectValue>
                        <div className="flex items-center gap-3">
                          <Image 
                            src={currentToToken.imageUrl} 
                            alt={currentToToken.symbol} 
                            width={32} 
                            height={32} 
                            className="rounded-full"
                          />
                          <span className="text-lg">{currentToToken.symbol}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.values(TOKENS).map(token => (
                        <SelectItem key={token.symbol} value={token.symbol} className="text-white hover:bg-gray-700">
                          <div className="flex items-center gap-3">
                            <Image 
                              src={token.imageUrl} 
                              alt={token.symbol} 
                              width={32} 
                              height={32} 
                              className="rounded-full"
                            />
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-yellow-400/80">
                  Available liquidity: {(liquidityPool[currentToToken.symbol] || 0).toLocaleString()} {currentToToken.symbol}
                </div>

                <div className="space-y-2">
                  <label className="text-white text-lg block">Your Photonic Wallet Address</label>
                  <Input
                    type="text"
                    placeholder="Enter your wallet address"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    required
                    className="h-16 bg-white/5 border-white/10 text-white placeholder-white/50 focus:ring-yellow-400 focus:border-yellow-400"
                  />
                </div>

                {estimatedAmount > 0 && (
                  <div className="text-lg text-yellow-400 font-semibold">
                    Estimated amount: {estimatedAmount.toFixed(6)} {currentToToken.symbol}
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-16 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Swap Tokens
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          ) : (
            <motion.div
              key="swap-result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 text-white"
            >
              <h2 className="text-2xl font-bold text-yellow-400">Swap Initiated</h2>
              <p>You are swapping {amount} {currentFromToken.symbol} for approximately {estimatedAmount.toFixed(6)} {currentToToken.symbol}.</p>
              <div className="bg-white/10 p-4 rounded-xl space-y-2">
                <p className="font-semibold">Please send {amount} {currentFromToken.symbol} to:</p>
                <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
                  <span className="text-sm break-all">{SWAP_WALLET}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigator.clipboard.writeText(SWAP_WALLET)}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sr-only">Copy wallet address</span>
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <Image src={`/placeholder.svg?height=150&width=150&text=${SWAP_WALLET}`} alt="QR Code" width={150} height={150} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <p>After sending, please enter your transaction ID to verify the swap:</p>
                <Input 
                  type="text" 
                  placeholder="Enter transaction ID" 
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="h-16 bg-white/5 border-white/10 text-white placeholder-white/50 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
              <Button 
                onClick={handleVerifyTransaction}
                disabled={isLoading}
                className="w-full h-16 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-bold text-lg rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  'Verify Transaction'
                )}
              </Button>
              <AnimatePresence>
                {verificationStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert className="bg-green-500/20 border-green-500/50 text-green-400">
                      <Check className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>
                        Your transaction has been verified successfully.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
                {verificationStatus === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert variant="destructive" className="bg-red-500/20 border-red-500/50 text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        There was an error verifying your transaction. Please try again or contact support.
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button 
                variant="outline" 
                onClick={handleBack} 
                className="w-full h-16 bg-white/5 hover:bg-white/10 text-white border-white/20"
              >
                Back to Swap
              </Button>
              <a 
                href={DISCORD_URL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="block text-center text-yellow-400 hover:underline transition-colors"
              >
                Need help? Join our Discord
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}