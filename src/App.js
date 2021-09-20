import './App.css';
import { useState } from 'react';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  Program,
  web3,
  Provider
} from '@project-serum/anchor';
import idl from './idl.json';
import { getPhantomWallet } from '@solana/wallet-adapter-wallets';
import { useWallet, ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletMultiButton, WalletModalProvider } from '@solana/wallet-adapter-react-ui';

//wallets
const wallets = [
  getPhantomWallet()
]

//getting SystemProgram and keypair from web3
const {SystemProgram, Keypair} = web3;


//creating a base account
const baseAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}

//getting the programId from the idl.json
const programID = new PublicKey(idl.metadata.address);

 const network = clusterApiUrl('devnet');

const App = () => {

  const[value, setValue] = useState(null);

  //the wallet 
  const wallet = useWallet();

  const getProvider = async() => {

    //establishing a connection to local
    const connection = new Connection(network, opts.preflightCommitment);

    //creating a provider using serum
    const provider = new Provider(
      connection,
      wallet,
      opts.preflightCommitment
    );
      return provider;
    }

    const createCounter = async() => {
      const provider = await getProvider()
      const program = new Program(idl, programID, provider);
      try{
        await program.rpc.create({
          accounts:{
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId
          },
          signers: [baseAccount]
        });

        const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
        console.log('account: ', account);
        setValue(account.count.toString());
      } catch(err){
        console.log("Transaction Error: ", err);
      }
    }

    const increment = async() => {
      const provider = await getProvider();
      const program = new Program(idl, programID, provider);
      await program.rpc.increment({
        accounts: {
          baseAccount: baseAccount.publicKey
        }
      });

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      console.log('account: ', account);
      setValue(account.count.toString()); 
    }

     if (!wallet.connected) {
    /* If the user's wallet is not connected, display connect wallet button. */
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop:'100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !value && (<button onClick={createCounter}>Create counter</button>)
          }
          {
            value && <button onClick={increment}>Increment counter</button>
          }

          {
            value && value >= Number(0) ? (
              <h2>{value}</h2>
            ) : (
              <h3>Please create the counter.</h3>
            )
          }
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider;
