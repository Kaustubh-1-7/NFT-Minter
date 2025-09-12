'use client';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected) {
    return (
      <div className="text-right">
        <p>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        <button onClick={() => disconnect()} className="px-4 py-2 mt-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
          Disconnect
        </button>
      </div>
    );
  }
  return (
    <button onClick={() => connect({ connector: injected() })} className="px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
      Connect Wallet
    </button>
  );
}