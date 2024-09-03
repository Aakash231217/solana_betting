import { AnchorProvider, BN, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { PROGRAM_ID } from "./constants";



const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getFallbackConnection = async () => {
  const endpoints = [
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
    clusterApiUrl('devnet'),
    clusterApiUrl('mainnet-beta'),
  ];

  for (const endpoint of endpoints) {
    if (endpoint) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const connection = new connection(endpoint, 'confirmed');
          // Test the connection
          await connection.getLatestBlockhash();
          console.log(`Connected successfully to ${endpoint}`);
          return connection;
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed for ${endpoint}:`, error);
        }
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY);
        }
      }
    }
  }

  throw new Error("Failed to establish a connection to any Solana endpoint");
};

// Create a function that gets the Solana program we created
export const getProgram = (connection, wallet) => {
    const IDL = require("./idl.json");
    const provider = new AnchorProvider(
        connection,
        wallet,
        AnchorProvider.defaultOptions(),
    );
    const program = new Program(IDL, PROGRAM_ID, provider);
    return program;
};

const getProgramAccountPk = async (seeds) => {
    return (await PublicKey.findProgramAddress(seeds, PROGRAM_ID))[0];
};

export const getMasterAccountPk = async () => {
    return await getProgramAccountPk([Buffer.from("master")]);
};

export const getBetAccountPk = async (id) => {
    return await getProgramAccountPk([
        Buffer.from("bet"),
        new BN(id).toArrayLike(Buffer, "le", 8)
    ]);
};