export type OnchainAcademy = {
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: unknown[];
  accounts: unknown[];
  errors: { code: number; name: string; msg: string }[];
  types: unknown[];
  events: unknown[];
};

import idlJson from "./idl.json";
export const IDL = idlJson as unknown as OnchainAcademy;
