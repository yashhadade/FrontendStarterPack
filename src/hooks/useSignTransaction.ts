
import Safe from '@safe-global/protocol-kit'
import blockchainTransactionService from '@/services/blockchainTransaction'
import { toast } from 'sonner'
import { BlockchainTransaction } from '@/components/blockchain/PendingTransactionsTable'

const useSignTransaction = () => {

    const signTransaction = async (tx: BlockchainTransaction, type: "approve" | "reject", publicAddress: string) => {
        try {
            if (!publicAddress) {
                toast.error('Please connect your wallet to sign transactions')
                return { success: false }
            }

            // Owner validation
            const isOwner = tx?.owners?.some(owner => owner.toLowerCase() === publicAddress.toLowerCase())
            if (!isOwner) {
                toast.error('You are not an authorized owner for this transaction')
                return { success: false }
            }

            const proposal = tx[`${type}Proposal`]
            if (!proposal) {
                toast.error(`No ${type} proposal found for this Transaction`)
                return { success: false }
            }

            const getTransactionToSignResponse = await blockchainTransactionService.getTransactionToSign({
                safeTxHash: proposal.safeTxHash,
                safeAddress: tx.approvalAccountAddress,
            })
            console.table(getTransactionToSignResponse)

            if (getTransactionToSignResponse.data && !getTransactionToSignResponse.data.success) {
                toast.error(getTransactionToSignResponse.data.message || 'Failed to get transaction to sign')
                return { success: false }
            }

            // if(getTransactionToSignResponse.data?.isValidApproverAdmin !== true){
            //     toast.error('You are not an authorized Admin to sign for this transaction')
            //     return { success: false }
            // }

            const protocolKit = await Safe.init({
                provider: window.ethereum,
                signer: publicAddress,
                safeAddress: tx.approvalAccountAddress,
            })

            const signedTx = await protocolKit.signTransaction(getTransactionToSignResponse.data?.safeTx)
            const sig = signedTx.signatures.get(publicAddress?.toLowerCase()).data

            const confirmTransactionRes = await blockchainTransactionService.confirmTransaction({
                safeTxHash: proposal.safeTxHash,
                signature: sig,
                signerAddress: publicAddress,
                safeAddress: tx.approvalAccountAddress,
                transactionId: tx._id,
                action: type,
            })

            if (confirmTransactionRes.data && !confirmTransactionRes.data.success) {
                toast.error(confirmTransactionRes.message || 'Failed to confirm transaction')
                return { success: false }
            }

            toast.success(`${type.toUpperCase()} signed successfully`)
            return { success: true, data: confirmTransactionRes.data.data }

        } catch (err) {
            console.error(err)
            toast.error('Failed to process transaction')
            console.log(err.message);
            return { success: false, error: err }
        }
    }

    return { signTransaction }
}

export default useSignTransaction
