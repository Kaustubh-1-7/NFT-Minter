import {createConfig} from '@privy-io/wagmi';

import {mainnet, sepolia} from 'viem/chains';
import {http} from 'wagmi';


export const config = createConfig({
  chains: [ sepolia], 
  transports: {
    [sepolia.id]: http(),
    
  },
});