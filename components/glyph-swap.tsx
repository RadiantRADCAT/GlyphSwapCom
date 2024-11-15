"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronDown, Copy } from 'lucide-react'

type TokenType = {
  symbol: string
  name: string
  imageUrl: string
  totalSupply: number
}

const TOKENS: Record<string, TokenType> = {
  RXD: { symbol: 'RXD', name: 'Radiant', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_33dd965b95d54dfe9af12ed99fe5c43a~mv2.png', totalSupply: 120000000 },
  RADCAT: { symbol: 'RADCAT', name: 'RadCat', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_c2c4b7bf64464273a2cf3e30d08a9692~mv2.png', totalSupply: 21000000 },
  FUGAZI: { symbol: 'FUGAZI', name: 'Fugazi', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_27b255b33ae74f2c9b7bb9a6c3cf9076~mv2.jpeg', totalSupply: 21000000 },
  PILIM: { symbol: 'PILIM', name: 'Pilim', imageUrl: 'https://static.wixstatic.com/media/c0fd9f_42bf29bc4cff49a2b50d46599890ecd7~mv2.png', totalSupply: 100000000000 },
}

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxtBhBPpGYwjUuksHmobgUNIo3rdEtsKULSUJMYvdb-iIOLY1aZieoN_Q1y_ZjVVSpRkA/exec'
const FEE_PERCENTAGE = 3
const SWAP_WALLET = 'YOUR_SWAP_WALLET_ADDRESS_HERE'
const DISCORD_URL = 'https://discord.gg/pwBMDDzWWG'

export default function GlyphSwap() {
  const [fromToken, setFromToken] = useState<TokenType>(TOKENS.RXD)
  const [toToken, setToToken] = useState<TokenType>(TOKENS.RADCAT)
  const [amount, setAmount] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  const [showSwapResult, setShowSwapResult] = useState(false)
  const [estimatedAmount, setEstimatedAmount] = useState(0)
  const [liquidityPool, setLiquidityPool] = useState<Record<string, number>>({})
  const [showFromDropdown, setShowFromDropdown] = useState(false)
  const [showToDropdown, setShowToDropdown] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)

  useEffect(() => {
    fetchLiquidityPool()
  }, [])

  useEffect(() => {
    updateEstimatedAmount()
  }, [amount, fromToken, toToken])

  async function fetchLiquidityPool() {
    try {
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=getLiquidityPool`)
      const data = await response.json()
      setLiquidityPool(data)
    } catch (error) {
      console.error('Error fetching liquidity pool:', error)
    }
  }

  function calculateSwapAmount(from: TokenType, to: TokenType, amt: number): number {
    const ratio = to.totalSupply / from.totalSupply
    const baseAmount = amt * ratio
    const feeAmount = baseAmount * (FEE_PERCENTAGE / 100)
    return baseAmount - feeAmount
  }

  function updateEstimatedAmount() {
    const amt = parseFloat(amount)
    if (!isNaN(amt)) {
      const estimated = calculateSwapAmount(fromToken, toToken, amt)
      setEstimatedAmount(estimated)
    } else {
      setEstimatedAmount(0)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      action: 'swap',
      tokenFrom: fromToken.symbol,
      tokenTo: toToken.symbol,
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
        [fromToken.symbol]: (prevPool[fromToken.symbol] || 0) + parseFloat(amount),
        [toToken.symbol]: (prevPool[toToken.symbol] || 0) - estimatedAmount
      }))
    } catch (error) {
      console.error('Error initiating swap:', error)
      alert('There was an error initiating the swap. Please try again.')
    }
  }

  function handleBack() {
    setShowSwapResult(false)
    setAmount('')
    setWalletAddress('')
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(SWAP_WALLET)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-fixed p-5 font-['Red_Hat_Display',sans-serif] overflow-y-auto"
         style={{backgroundImage: "url('https://static.wixstatic.com/media/c0fd9f_7a29e6d3a40f4821a14dbe8f93b9d069~mv2.jpg')"}}>
      <div className="max-w-[480px] w-full bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Image src="https://static.wixstatic.com/media/c0fd9f_cfacf9e215804e3a8ad37a1f5e0d3f11~mv2.png" alt="Glyph Swap Logo" width={24} height={24} />
            <span className="font-bold">Glyph</span> <span className="font-normal italic">Swap</span>
          </h1>
          <div className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">Beta</div>
        </div>

        {!showSwapResult ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fromToken" className="block text-sm font-medium text-gray-600">From</label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full p-3 bg-white/80 border border-white/20 rounded-lg flex items-center justify-between cursor-pointer transition hover:bg-white/95 hover:border-yellow-400"
                  onClick={() => setShowFromDropdown(!showFromDropdown)}
                >
                  <div className="flex items-center gap-3">
                    <Image src={fromToken.imageUrl} alt={fromToken.symbol} width={24} height={24} className="rounded-full" />
                    <span>{fromToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </button>
                {showFromDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
                    {Object.values(TOKENS).map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        className="w-full p-3 flex items-center gap-3 hover:bg-white/80 transition"
                        onClick={() => {
                          setFromToken(token)
                          setShowFromDropdown(false)
                        }}
                      >
                        <Image src={token.imageUrl} alt={token.symbol} width={24} height={24} className="rounded-full" />
                        <span>{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-gray-600">Amount</label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                min="0"
                step="any"
                required
                className="w-full p-3 bg-white/80 border border-white/20 rounded-lg transition focus:outline-none focus:border-yellow-400 focus:bg-white/95"
              />
              <p className="text-xs text-gray-500">
                Minimum input: {(0.000001).toFixed(6)} {fromToken.symbol} (including {FEE_PERCENTAGE}% fee)
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="toToken" className="block text-sm font-medium text-gray-600">To</label>
              <div className="relative">
                <button
                  type="button"
                  className="w-full p-3 bg-white/80 border border-white/20 rounded-lg flex items-center justify-between cursor-pointer transition hover:bg-white/95 hover:border-yellow-400"
                  onClick={() => setShowToDropdown(!showToDropdown)}
                >
                  <div className="flex items-center gap-3">
                    <Image src={toToken.imageUrl} alt={toToken.symbol} width={24} height={24} className="rounded-full" />
                    <span>{toToken.symbol}</span>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </button>
                {showToDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-auto z-10">
                    {Object.values(TOKENS).map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        className="w-full p-3 flex items-center gap-3 hover:bg-white/80 transition"
                        onClick={() => {
                          setToToken(token)
                          setShowToDropdown(false)
                        }}
                      >
                        <Image src={token.imageUrl} alt={token.symbol} width={24} height={24} className="rounded-full" />
                        <span>{token.symbol}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              Available liquidity: {(liquidityPool[toToken.symbol] || 0).toLocaleString()} {toToken.symbol}
            </div>

            <div className="space-y-2">
              <label htmlFor="walletAddress" className="block text-sm font-medium text-gray-600">Your Photonic Wallet Address</label>
              <input
                type="text"
                id="walletAddress"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter your wallet address"
                required
                className="w-full p-3 bg-white/80 border border-white/20 rounded-lg transition focus:outline-none focus:border-yellow-400 focus:bg-white/95"
              />
            </div>

            {estimatedAmount > 0 && (
              <div className="bg-gray-100/80 p-3 rounded-lg text-sm text-gray-600 text-center">
                Estimated amount: {estimatedAmount.toFixed(6)} {toToken.symbol}
              </div>
            )}

            <button type="submit" className="w-full p-3 bg-yellow-400/90 text-white font-medium rounded-lg transition hover:bg-yellow-500/90">
              Swap Tokens
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <h2 className="text-xl font-bold">Swap Initiated</h2>
            <p>You are swapping {amount} {fromToken.symbol} for approximately {estimatedAmount.toFixed(6)} {toToken.symbol}.</p>
            <p>Please send {amount} {fromToken.symbol} to the following address:</p>
            <div className="bg-gray-100/80 p-2 rounded-lg flex items-center justify-between">
              <span className="text-sm break-all">{SWAP_WALLET}</span>
              <button onClick={copyToClipboard} className="p-1 hover:bg-gray-200/80 rounded transition">
                <Copy className="h-4 w-4" />
              </button>
            </div>
            {copySuccess && <p className="text-green-600 text-sm">Copied to clipboard!</p>}
            <div className="flex justify-center">
              <Image src={`/placeholder.svg?height=150&width=150&text=${SWAP_WALLET}`} alt="QR Code" width={150} height={150} />
            </div>
            <button onClick={handleBack} className="w-full p-3 bg-gray-100/80 text-gray-600 font-medium rounded-lg transition hover:bg-gray-200/80">
              Back to Swap
            </button>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="block text-yellow-400 hover:text-yellow-500 transition">
              Need help? Join our Discord
            </a>
          </div>
        )}
      </div>
    </div>
  )
}