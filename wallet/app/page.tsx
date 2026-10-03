import { WalletApp } from '@/components/wallet/wallet-app'
import { WalletProvider } from '@/lib/wallet-context'

export default function Page() {
  return (
    <WalletProvider>
      <WalletApp />
    </WalletProvider>
  )
}
