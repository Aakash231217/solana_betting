import { AnchorProvider,BN,Program } from "@project-serum/anchor";
import { PublicKey,Connection } from "@solana/web3.js";
// import { Connection } from '@solana/web3.js';


import { MINIUM_REMAINING_TIME_UNTIL_EXPIRY, PROGRAM_ID } from "./constants";

// create a fn to get the solana program we created

export const getProgram = (connection, wallet)=>{
    const IDL = require("./idl.json");
    const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions()
    )
    const program = new Program(IDL,PROGRAM_ID,provider)
    return program;
}
export const getProgramAccountPk = async(seeds)=>{
    return (await PublicKey.findProgramAddressSync(seeds,PROGRAM_ID))[0];
}
export const getMasterAccountPk = async()=>{
    return await getProgramAccountPk([Buffer.from("master")]);
}
export const getBetAccountPk = async (id)=>{
    return await getProgramAccountPk([
        Buffer.from("bet"),
        new BN(id).toArrayLike(Buffer, "le", 8)
    ]);
}