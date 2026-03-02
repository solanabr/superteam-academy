
import * as anchor from '@coral-xyz/anchor'
import {  Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "~/types/onchain_academy";

import IDL from "~/types/idl/onchain_academy.json"

export function getProgram(): Program<OnchainAcademy> {
   const provider = anchor.AnchorProvider.env()
   // anchor.setProvider(provider)
   return new Program<OnchainAcademy>(IDL, provider)
}