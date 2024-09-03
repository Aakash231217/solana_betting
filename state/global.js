import { createContext, useCallback, useEffect, useState } from "react";
import { Transaction } from "@solana/web3.js";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram, getMasterAccountPk, getBetAccountPk } from "../utils/program";
import toast from "react-hot-toast";

export const GlobalContext = createContext({
    isConnected: null,
    wallet: null,
    hasUserAccount: null,
    allBets: null,
    fetchBets: null,
})

export const GlobalState = ({children}) => {
    const [program,setProgram] = useState()
    const [isConnected,setIsConnected] = useState()
    const [masterAccount,setMasterAccount] = useState()
    const [allBets,setAllBets] = useState()
    const [userBets,setUserBets] = useState()

    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    // set program
    useEffect(()=>{
        if(connection){
            setProgram(getProgram(connection,wallet ?? {}))
        }else {
            setProgram(null);
        }
    },[connection,wallet])

    // check for wallet connection
    useEffect(()=>{
        setIsConnected(!!wallet?.publicKey)
    },[wallet]);

    const fetchMasterAccount = useCallback(async ()=>{
        if(!program) return;
        try{
            const masterAccountPk = await getMasterAccountPk();
            const masterAccount = await program.account.master.fetch(masterAccountPk);
            setMasterAccount(masterAccount);
        }catch(e){
            console.log("Couldn't Fetch Master Account:",e.message);
            setMasterAccount(null);
        }
    })
    // cheeck for master account
    useEffect(()=>{
        if(!masterAccount && program){
            fetchMasterAccount();
        }
    },[masterAccount,program]);

    const fetchBets = useCallback(async()=>{
        if(!program) return;
        const allBetsResult = await program.account.bet.all();
        // console.log(allBetsResult);
        const allBets = allBetsResult.map((bet)=>bet.account);
        // console.log(allBets);
        setAllBets(allBets);
        // filter to get just the use bets
    },[program])
    useEffect(()=>{
        // fetch all bets if not alrady
        if(!allBets){
            fetchBets();
        }
    },[allBets,masterAccount])

    const createBet = useCallback(
        async (amount, price, duration, pythPriceKey) => {
            // console.log("inside createBet");
            if (!masterAccount) return;
            try {
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
                
                const betId = masterAccount.lastBetId.addn(1);
                const betPk = await getBetAccountPk(betId);
                const masterPk = await getMasterAccountPk();
                const player = wallet.publicKey;
    
                // console.log(betPk.toString(), "Bet", masterPk.toString(), "Master", player.toString(), "Player");
    
                // Create the transaction manually
                const transaction = new Transaction({
                    recentBlockhash: blockhash,
                    feePayer: player,
                });
    
                // Create the instruction using the program method
                const createBetInstruction = await program.methods
                    .createBet(amount, price, duration, pythPriceKey)
                    .accounts({
                        bet: betPk,
                        master: masterPk,
                        player,
                    })
                    .instruction();  // Ensure this returns a valid instruction
    
                // Check if the instruction has a valid program ID
                if (!createBetInstruction.programId) {
                    throw new Error("Instruction has undefined program id");
                }
    
                // Add the instruction to the transaction
                transaction.add(createBetInstruction);
    
                // Sign and send the transaction
                const signedTx = await wallet.signTransaction(transaction);
                const txHash = await connection.sendRawTransaction(signedTx.serialize());
    
                // Confirm the transaction
                await connection.confirmTransaction({
                    signature: txHash,
                    blockhash,
                    lastValidBlockHeight,
                });
    
                console.log("Created bet!", txHash);
                toast.success("Created Bet!");
            } catch (e) {
                toast.error("Failed to create Bet");
                console.log(e.message);
            }
        },
        [masterAccount]
    );
    
    const closeBet = useCallback(
        async (bet) => {
            if (!masterAccount) return;
            try {
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
                // Retrieve the public key for the bet that needs to be closed
                const betPk = await getBetAccountPk(bet.id);
                const player = wallet.publicKey;
    
                // console.log(betPk.toString(), "Bet", player.toString(), "Player");
    
                // Create the transaction manually
                const transaction = new Transaction({
                    recentBlockhash: blockhash,
                    feePayer: player,
                });
    
                // Create the instruction to close the bet
                const closeBetInstruction = await program.methods
                    .closeBet()
                    .accounts({
                        bet: betPk,
                        player,
                    })
                    .instruction();  // Ensure this returns a valid instruction
    
                // Check if the instruction has a valid program ID
                if (!closeBetInstruction.programId) {
                    throw new Error("Instruction has undefined program id");
                }
    
                // Add the instruction to the transaction
                transaction.add(closeBetInstruction);
    
                // Sign and send the transaction
                const signedTx = await wallet.signTransaction(transaction);
                const txHash = await connection.sendRawTransaction(signedTx.serialize());
    
                // Confirm the transaction
                await connection.confirmTransaction({
                    signature: txHash,
                    blockhash,
                    lastValidBlockHeight,
                });
    
                console.log("Closed bet!", txHash);
                toast.success("Closed Bet!");
            } catch (e) {
                toast.error("Failed to close bet!");
                console.log("Couldn't close bet", e.message);
            }
        },
        [masterAccount]
    );

    const enterBet = useCallback(
        async (price,bet) => {
            if (!masterAccount) return;
            try {
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
                // Retrieve the public key for the bet that needs to be closed
                const betPk = await getBetAccountPk(bet.id);
                const player = wallet.publicKey;
    
                // console.log(betPk.toString(), "Bet", player.toString(), "Player");
    
                // Create the transaction manually
                const transaction = new Transaction({
                    recentBlockhash: blockhash,
                    feePayer: player,
                });
    
                // Create the instruction to close the bet
                const enterBetInstruction = await program.methods
                    .enterBet(price)
                    .accounts({
                        bet: betPk,
                        player,
                    })
                    .instruction();  // Ensure this returns a valid instruction
    
                // Check if the instruction has a valid program ID
                if (!enterBetInstruction.programId) {
                    throw new Error("Instruction has undefined program id");
                }
    
                // Add the instruction to the transaction
                transaction.add(enterBetInstruction);
    
                // Sign and send the transaction
                const signedTx = await wallet.signTransaction(transaction);
                const txHash = await connection.sendRawTransaction(signedTx.serialize());
    
                // Confirm the transaction
                await connection.confirmTransaction({
                    signature: txHash,
                    blockhash,
                    lastValidBlockHeight,
                });
    
                console.log("Entered bet!", txHash);
                toast.success("Entered Bet!");
            } catch (e) {
                toast.error("Failed to Enter bet!");
                console.log("Couldn't Enter bet", e.message);
            }
        },
        [masterAccount]
    );

    const claimBet = useCallback(
        async (bet) => {
            if (!masterAccount) return;
            try {
                // console.log(bet);
                const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    
                // Retrieve the public key for the bet that needs to be closed
                const betPk = await getBetAccountPk(bet.id);
                const pythprize = bet.pythPriceKey;
                const playerApredict = bet.predictionA.player;
                const playerBpredict = bet.predictionB.player;
                const player = wallet.publicKey;
    
                // console.log(betPk.toString(), "Bet", player.toString(), "Player");
    
                // Create the transaction manually
                const transaction = new Transaction({
                    recentBlockhash: blockhash,
                    feePayer: player,
                });
    
                // Create the instruction to close the bet
                const claimBetInstruction = await program.methods
                    .claimBet()
                    .accounts({
                        bet: betPk,
                        pyth: pythprize,
                        playerA: playerApredict,
                        playerB: playerBpredict,
                        signer: player
                    })
                    .instruction();  // Ensure this returns a valid instruction
    
                // Check if the instruction has a valid program ID
                if (!claimBetInstruction.programId) {
                    throw new Error("Instruction has undefined program id");
                }
    
                // Add the instruction to the transaction
                transaction.add(claimBetInstruction);
    
                // Sign and send the transaction
                const signedTx = await wallet.signTransaction(transaction);
                const txHash = await connection.sendRawTransaction(signedTx.serialize());
    
                // Confirm the transaction
                await connection.confirmTransaction({
                    signature: txHash,
                    blockhash,
                    lastValidBlockHeight,
                });
    
                console.log("Claimed bet!", txHash);
                toast.success("Claimed Bet!");
            } catch (e) {
                toast.error("Failed to Claim bet!");
                console.log("Couldn't Claim bet", e);
            }
        },
        [masterAccount]
    );

    // const ClaimBet = useCallback(
    //     async(price, bet)=>{
    //         if(!masterAccount) return;
    //         try{
    //             const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    //             console.log(bet.id);
    //             const betPk = await getBetAccountPk(bet.id);
    //             const player = wallet.publicKey;

    //             const transaction = new Transaction({
    //                 recentBlockhash: blockhash,
    //                 feePayer: player,
    //             });

    //             const enterBetInstruction = await program.methods
    //                 .enterBet(price)
    //                 .accounts({
    //                     bet: betPk,
    //                     player: player,
    //                 })
    //                 .instruction();
                
    //             if (!enterBetInstruction.programId) {
    //                 throw new Error("Instruction has undefined program id");
    //             }
                
    //             transaction.add(enterBetInstruction);

    //             const signedTx = await wallet.signTransaction(transaction);
    //             const txHash = await connection.sendRawTransaction(signedTx.serialize());

    //             await connection.confirmTransaction({
    //                 signature: txHash,
    //                 blockhash,
    //                 lastValidBlockHeight,
    //             });

    //             console.log("Enter bet!", txHash);
    //             toast.success("Entered Bet!");

    //         }catch(e){
    //             console.log("Couldn't enter Bet",e);
    //             toast.error("Failed to Enter bet!");
    //         }

    //     }
    // );

    // const createBet = useCallback(
    //     async (amount,price,duration,pythPriceKey)=>{
    //         console.log("inside createbet");
    //         if(!masterAccount) return;
    //         try{
    //             const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    //             const betId = masterAccount.lastBetId.addn(1);
    //             const res = await getBetAccountPk(betId);
    //             console.log({betPk: res})
    //             let bet = await getBetAccountPk(betId);
    //             let master = await getMasterAccountPk();
    //             let player = wallet.publicKey;
    //             console.log(
    //                 bet.toString(), "Bet",
    //                 master.toString(),"master",
    //                 player.toString(),"player"
    //             )
    //             const transaction = new Transaction({
    //                 recentBlockhash: blockhash,
    //                 feePayer: player,
    //             });
    //             console.log()
    //             transaction.add(
    //                 program.methods
    //                     .createBet(amount, price, duration, pythPriceKey)
    //                     .accounts({
    //                         bet: await getBetAccountPk(betId),
    //                         master: await getMasterAccountPk(),
    //                         player: wallet.publicKey,
    //                     })
    //                     .instruction()
    //             );
    //             // Sign and send the transaction
    //         const signedTx = await wallet.signTransaction(transaction);
    //         const txHash = await connection.sendRawTransaction(signedTx.serialize());

    //         // Confirm the transaction
    //         await connection.confirmTransaction({
    //             signature: txHash,
    //             blockhash,
    //             lastValidBlockHeight,
    //         });
    //             // const txHash = await program.methods
    //             // .createBet(amount,price,duration,pythPriceKey)
    //             // .accounts({
    //             //     bet: await getBetAccountPk(betId),
    //             //     master: await getMasterAccountPk(),
    //             //     player: wallet.publicKey,
    //             // })
    //             // .rpc({ recentBlockhash: blockhash })
    //             // await connection.confirmTransaction({
    //             //     signature: txHash,
    //             //     blockhash,
    //             //     lastValidBlockHeight,
    //             // });
    //             console.log("Creeated bet!", txHash);
    //             toast.success("Created Bet!");
    //         }catch(e){
    //             toast.error("Failed! to create Bet");
    //             console.log(e);
    //         }
    //     },[
    //         masterAccount,
    //         allBets,
    //         createBet,
    //     ]
    // )

    return (
        <GlobalContext.Provider
            value={{
                masterAccount,
                allBets,
                createBet,
                closeBet,
                enterBet,
                claimBet
            }}
            >
                {children}
        </GlobalContext.Provider>
    )
}