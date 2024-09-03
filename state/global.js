import { createContext, useCallback, useEffect,useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";

import { getProgram, getBetAccountPk, getMasterAccountPk } from "../utils/program";
import toast from "react-hot-toast";

export const GlobalContext=createContext({
    isConnected:null,
    wallet:null,
    hasUserAccount:null,
    allBets:null,
    fetchBets:null,
    createBet:null,


})

export const GlobalState = ({children})=>{
    const [program,setProgram] = useState();
    const [isConnected, setIsConnected] = useState();
    const [masterAccount,setMasterAccount] = useState();
    const [allBets, setAllBets] = useState();
    const [userBets,setUserBets] = useState();

    const {connection} = useConnection();
    const wallet = useAnchorWallet();
    //setProgram

    useEffect(()=>{
        if(connection && wallet){
            setProgram(getProgram(connection,wallet ?? {}));
        }
        else{
            setProgram(null);
        }
    },[connection,wallet])

    //check with wallet connection
    useEffect(()=>{
     setIsConnected(!!wallet?.publicKey)
    },[wallet]);

    const fetchMasterAccount = useCallback(async()=>{
        if(!program)return;

        try{
           const masterAccountPk = await getMasterAccountPk();
           const masterAccount  = await program.account.master.fetch(masterAccountPk);
           setMasterAccount(masterAccount);

        }catch(e){
            console.log("Couldn't fetch master account:",e.message)
            setMasterAccount(null);
        }
    },[program])


    //check for masterAccount

    useEffect(()=>{
        if(!masterAccount && program){
            fetchMasterAccount();
        }
    },[masterAccount,program,fetchMasterAccount])

    const fetchBets = useCallback(async()=>{
        if(!program)return;
        const allBetsResult = await program.account.bet.all();
        const allBets = allBetsResult.map((bet)=>bet.account);
        setAllBets(allBets)
    },[program]
)

  useEffect(()=>{
    //fetch all bets if all bets doesn't exist

    if(!allBets){
        fetchBets();
    }
  },[allBets,fetchBets])

  const createBet = useCallback(
    async(amount,price,duration, pythPriceKey)=>{
        if(!masterAccount || !wallet || !program)return;

        try{
            const betId = masterAccount.lastBetId.addn(1);
            const res = await getBetAccountPk(betId);
            console.log({betPk:res})
            const txHash = await program.methods
            .createBet(amount,price,duration,pythPriceKey)
            .accounts({
                bet:await getBetAccountPk(betId),
                master: await getMasterAccountPk(),
                player:wallet.publicKey,
            })
            .rpc()
            await retryAsync(() => connection.confirmTransaction(txHash), 3, 1000);
            console.log("Created Bet",txHash);
            toast.success("Created bet");
        }catch(e){
            toast.error("Failed to create a bet");
            console.log(e.message);
        }
    },
    [masterAccount,wallet,program,connection]
  )
  
  const closeBet = useCallback(
    async(bet)=>{
        if(!masterAccount)return;
        try{
          const txHash = await program.methods
          .closeBet()
          .accounts({
            bet:await getBetAccountPk(bet.id),
            player:wallet.publicKey,
          })
          .rpc()
          await retryAsync(() => connection.confirmTransaction(txHash), 3, 1000);
          toast.success("Closed bet !")
        }catch(e){
            toast.error("Failed to close bet!");
            console.log("Couldn;t close bet",e.message);
        }
    },
    [masterAccount]
  )
  const enterBet = useCallback(
    async(price,bet)=>{
        if(!masterAccount)return;
        try{
            const txHash = await program.methods
            .enterBet(price)
            .accounts({
                bet:await getBetAccountPk(bet.id),
                player:wallet.publicKey
            })
            .rpc();
            toast.success("Entered bet");
        }catch(e){
            console.log("Couldnt enter bet",e.message);
            toast.error("Faied to enter bet");
        }
    }
  )


    return (
        <GlobalContext.Provider
        value={{
        masterAccount,
        allBets,
        createBet,
        closeBet,
        enterBet,

        }}>
          {children}
        </GlobalContext.Provider>
    )
}

const retryAsync = async (fn, retries, delay) => {
    while (retries > 0) {
        try {
            await fn();
            return;
        } catch (err) {
            if (--retries === 0) throw err;
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
};