import { useCallback } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { useSnackbar } from 'notistack'
import { ethers } from 'ethers'
import { useDltAddressStore } from '@/store/dltAddressStrore'
import { toast } from 'sonner'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

const REQUIRED_NETWORK = {
  name: 'Sepolia',
  chainId: import.meta.env.VITE_CHAIN_ID,
  chainIdHex: import.meta.env.VITE_CHAIN_ID_HEX
}


/**
 * Custom hook for connecting to MetaMask wallet
 * @returns {Object} { connectWallet, disconnectWallet, publicAddress, provider, signer, isConnected }
 */
const useConnectWallet = () => {
  const { setDltAddress } = useDltAddressStore()
  // const { enqueueSnackbar } = useSnackbar()
  const dltAddress = useDltAddressStore((state) => state.dltAddress)

  /**
   * Connect to MetaMask wallet
   * @returns {Promise<void>}
   */
  const connectWallet = useCallback(async () => {
  try {
    if (!window.ethereum) {
      throw new Error('MetaMask not found')
    }

    // 1️⃣ Check current network
    const currentChainId = await window.ethereum.request({
      method: 'eth_chainId'
    })

    // 2️⃣ Switch if needed
    if (currentChainId !== REQUIRED_NETWORK.chainIdHex) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: REQUIRED_NETWORK.chainIdHex }]
        })

        toast.success(
          `Switched to ${REQUIRED_NETWORK.name} network`,
        )
      } catch (switchError) {
        toast.error(switchError.message || 'Failed to switch network')
        throw switchError
      }
    }

    // 3️⃣ Connect wallet
    const ethProvider = new ethers.BrowserProvider(window.ethereum)
    const signer = await ethProvider.getSigner()
    const address = await signer.getAddress()

    setDltAddress(address)
    toast.success('Wallet connected successfully')

    return { provider: ethProvider, signer, address }

  } catch (err) {
    console.error('connectWallet:', err)
    toast.error(
      err.message || 'Failed to connect wallet'
    )
    throw err
  }
}, [setDltAddress])


  /**
   * Disconnect wallet
   */
  const disconnectWallet = useCallback(() => {
    setDltAddress('')
    toast.success('Wallet disconnected')
  }, [setDltAddress])

  const isConnected = !!dltAddress

  return {
    connectWallet,
    disconnectWallet,
    dltAddress,
    isConnected,
  }
}

export default useConnectWallet
