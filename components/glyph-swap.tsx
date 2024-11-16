"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Check, Copy, ChevronDown } from 'lucide-react'
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

  // ... (keeping all the existing functions)

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
              {/* ... (keeping the swap result view unchanged) ... */}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}