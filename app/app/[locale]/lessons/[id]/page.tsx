'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, CheckCircle, Circle, Zap, Code2,
  BookOpen, ArrowLeft, Play, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import { localePath } from '@/lib/paths';

const L = (obj: Record<string, string>, locale: string) => obj[locale] ?? obj['pt-BR'];

function EditorLoadingFallback() {
  const tLesson = useTranslations('lesson');
  return (
    <div className="flex h-full items-center justify-center bg-gray-900 text-gray-500 text-sm">
      {tLesson('loading_editor')}
    </div>
  );
}

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <EditorLoadingFallback />,
});

const COURSE_TITLE: Record<string, string> = {
  'pt-BR': 'Introdução ao Solana',
  'en': 'Introduction to Solana',
  'es': 'Introducción a Solana',
};

const LESSONS = [
  {
    id: 'intro-1',
    title: {
      'pt-BR': 'O que \u00e9 Solana? Arquitetura e Proof of History',
      'en': 'What is Solana? Architecture and Proof of History',
      'es': '\u00bfQu\u00e9 es Solana? Arquitectura y Proof of History',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 25,
    completed: true,
    content: {
      'pt-BR': `# O que \u00e9 Solana?

Solana \u00e9 uma blockchain de alta performance capaz de processar **65,000 transa\u00e7\u00f5es por segundo** com tempo de finaliza\u00e7\u00e3o de menos de 400ms e taxas m\u00ednimas (~0.000005 SOL por transa\u00e7\u00e3o).

## Proof of History (PoH)

O grande diferencial da Solana \u00e9 o **Proof of History** \u2014 um rel\u00f3gio criptogr\u00e1fico que permite aos validadores chegar a um consenso sobre a ordem dos eventos sem precisar se comunicar entre si.

## Arquitetura

- **Validators**: Processam transa\u00e7\u00f5es e produzem blocos
- **Leaders**: Escolhidos via VRF para produzir blocos em slots de 400ms
- **Tower BFT**: Variante do PBFT otimizada para PoH
- **Turbine**: Propaga\u00e7\u00e3o de blocos em blocos menores (shreds)
- **Gulf Stream**: Encaminhamento de transa\u00e7\u00f5es sem mempool
- **Sealevel**: Execu\u00e7\u00e3o paralela de contratos

## Contas no modelo Solana

Diferente do Ethereum, Solana separa **c\u00f3digo** (programas) de **dados** (contas). Um programa n\u00e3o armazena estado \u2014 o estado fica em contas separadas que o programa pode ler/escrever.`,
      'en': `# What is Solana?

Solana is a high-performance blockchain capable of processing **65,000 transactions per second** with finalization times under 400ms and minimal fees (~0.000005 SOL per transaction).

## Proof of History (PoH)

Solana\u2019s key innovation is **Proof of History** \u2014 a cryptographic clock that lets validators agree on event ordering without needing to communicate with each other.

## Architecture

- **Validators**: Process transactions and produce blocks
- **Leaders**: Selected via VRF to produce blocks in 400ms slots
- **Tower BFT**: PBFT variant optimized for PoH
- **Turbine**: Block propagation via smaller pieces (shreds)
- **Gulf Stream**: Transaction forwarding without a mempool
- **Sealevel**: Parallel smart contract execution

## The Solana Account Model

Unlike Ethereum, Solana separates **code** (programs) from **data** (accounts). A program doesn\u2019t store state \u2014 state lives in separate accounts that the program can read/write.`,
      'es': `# \u00bfQu\u00e9 es Solana?

Solana es una blockchain de alto rendimiento capaz de procesar **65,000 transacciones por segundo** con tiempos de finalizaci\u00f3n menores a 400ms y tarifas m\u00ednimas (~0.000005 SOL por transacci\u00f3n).

## Proof of History (PoH)

La gran innovaci\u00f3n de Solana es el **Proof of History** \u2014 un reloj criptogr\u00e1fico que permite a los validadores acordar el orden de los eventos sin necesidad de comunicarse entre s\u00ed.

## Arquitectura

- **Validators**: Procesan transacciones y producen bloques
- **Leaders**: Elegidos v\u00eda VRF para producir bloques en slots de 400ms
- **Tower BFT**: Variante de PBFT optimizada para PoH
- **Turbine**: Propagaci\u00f3n de bloques en piezas menores (shreds)
- **Gulf Stream**: Env\u00edo de transacciones sin mempool
- **Sealevel**: Ejecuci\u00f3n paralela de contratos inteligentes

## El modelo de cuentas de Solana

A diferencia de Ethereum, Solana separa **c\u00f3digo** (programas) de **datos** (cuentas). Un programa no almacena estado \u2014 el estado vive en cuentas separadas que el programa puede leer/escribir.`,
    },
    starterCode: {
      'pt-BR': `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Conectando ao devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function main() {
  // TODO: Crie um novo Keypair
  // TODO: Consulte o saldo de uma conta
  // TODO: Fa\u00e7a um airdrop de 1 SOL para testar

  console.log("Ol\u00e1, Solana!");
}

main().catch(console.error);`,
      'en': `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Connecting to devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function main() {
  // TODO: Create a new Keypair
  // TODO: Query an account balance
  // TODO: Request an airdrop of 1 SOL for testing

  console.log("Hello, Solana!");
}

main().catch(console.error);`,
      'es': `import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

// Conectando al devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function main() {
  // TODO: Crea un nuevo Keypair
  // TODO: Consulta el saldo de una cuenta
  // TODO: Solicita un airdrop de 1 SOL para probar

  console.log("\u00a1Hola, Solana!");
}

main().catch(console.error);`,
    },
  },
  {
    id: 'intro-2',
    title: {
      'pt-BR': 'Contas, Lamports e o modelo de dados',
      'en': 'Accounts, Lamports, and the data model',
      'es': 'Cuentas, Lamports y el modelo de datos',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 30,
    completed: true,
    content: {
      'pt-BR': `# Contas e Lamports

No modelo Solana, tudo \u00e9 uma **conta**. Programas, tokens, NFTs, e dados de usu\u00e1rio \u2014 tudo vive em contas.

## Lamports

1 SOL = **1,000,000,000 lamports**. As taxas s\u00e3o cobradas em lamports.

## Rent

Contas precisam manter um saldo m\u00ednimo para cobrir o "aluguel" do espa\u00e7o de armazenamento. Se o saldo for suficiente para 2 anos de rent, a conta se torna **rent-exempt**.`,
      'en': `# Accounts and Lamports

In the Solana model, everything is an **account**. Programs, tokens, NFTs, and user data \u2014 everything lives in accounts.

## Lamports

1 SOL = **1,000,000,000 lamports**. Transaction fees are charged in lamports.

## Rent

Accounts must maintain a minimum balance to cover storage "rent." If the balance covers 2 years of rent, the account becomes **rent-exempt**.`,
      'es': `# Cuentas y Lamports

En el modelo de Solana, todo es una **cuenta**. Programas, tokens, NFTs y datos de usuario \u2014 todo vive en cuentas.

## Lamports

1 SOL = **1,000,000,000 lamports**. Las tarifas se cobran en lamports.

## Rent

Las cuentas deben mantener un saldo m\u00ednimo para cubrir el "alquiler" del espacio de almacenamiento. Si el saldo cubre 2 a\u00f1os de rent, la cuenta se vuelve **rent-exempt**.`,
    },
    starterCode: {
      'pt-BR': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

async function explorarContas() {
  const keypair = Keypair.generate();
  console.log("Pubkey:", keypair.publicKey.toBase58());

  // Verificar informa\u00e7\u00f5es de uma conta
  const accountInfo = await connection.getAccountInfo(keypair.publicKey);
  console.log("Account info:", accountInfo);

  // Calcular rent m\u00ednimo para 100 bytes de dados
  const rentExempt = await connection.getMinimumBalanceForRentExemption(100);
  console.log("Rent exempt para 100 bytes:", rentExempt / LAMPORTS_PER_SOL, "SOL");
}

explorarContas();`,
      'en': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

async function exploreAccounts() {
  const keypair = Keypair.generate();
  console.log("Pubkey:", keypair.publicKey.toBase58());

  // Check account information
  const accountInfo = await connection.getAccountInfo(keypair.publicKey);
  console.log("Account info:", accountInfo);

  // Calculate minimum rent for 100 bytes of data
  const rentExempt = await connection.getMinimumBalanceForRentExemption(100);
  console.log("Rent exempt for 100 bytes:", rentExempt / LAMPORTS_PER_SOL, "SOL");
}

exploreAccounts();`,
      'es': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");

async function explorarCuentas() {
  const keypair = Keypair.generate();
  console.log("Pubkey:", keypair.publicKey.toBase58());

  // Verificar informaci\u00f3n de una cuenta
  const accountInfo = await connection.getAccountInfo(keypair.publicKey);
  console.log("Account info:", accountInfo);

  // Calcular rent m\u00ednimo para 100 bytes de datos
  const rentExempt = await connection.getMinimumBalanceForRentExemption(100);
  console.log("Rent exempt para 100 bytes:", rentExempt / LAMPORTS_PER_SOL, "SOL");
}

explorarCuentas();`,
    },
  },
  {
    id: 'intro-3',
    title: {
      'pt-BR': 'Configurando o ambiente: Solana CLI + Phantom',
      'en': 'Setting up the environment: Solana CLI + Phantom',
      'es': 'Configurando el entorno: Solana CLI + Phantom',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 20,
    completed: false,
    content: {
      'pt-BR': `# Configurando seu Ambiente

## Solana CLI

Instale o Solana CLI, configure para devnet, crie um keypair e solicite SOL de teste.

## Phantom Wallet

Instale a extens\u00e3o Phantom no navegador, crie uma carteira, e mude para a rede devnet nas configura\u00e7\u00f5es.

## Pr\u00f3ximos passos

Com o CLI e a carteira configurados, voc\u00ea est\u00e1 pronto para enviar sua primeira transa\u00e7\u00e3o!`,
      'en': `# Setting Up Your Environment

## Solana CLI

Install the Solana CLI, configure it for devnet, create a keypair, and request test SOL.

## Phantom Wallet

Install the Phantom browser extension, create a wallet, and switch to devnet in the settings.

## Next Steps

With the CLI and wallet set up, you\u2019re ready to send your first transaction!`,
      'es': `# Configurando tu Entorno

## Solana CLI

Instala el Solana CLI, configura para devnet, crea un keypair y solicita SOL de prueba.

## Phantom Wallet

Instala la extensi\u00f3n Phantom en el navegador, crea una billetera y cambia a la red devnet en la configuraci\u00f3n.

## Pr\u00f3ximos pasos

Con el CLI y la billetera configurados, \u00a1est\u00e1s listo para enviar tu primera transacci\u00f3n!`,
    },
    starterCode: {
      'pt-BR': `import { Keypair } from "@solana/web3.js";

// Gerar novo keypair
const keypair = Keypair.generate();
console.log("Chave p\u00fablica:", keypair.publicKey.toBase58());

// NUNCA compartilhe sua chave privada!
const keyData = JSON.stringify(Array.from(keypair.secretKey));
console.log("Keypair gerado com sucesso!");`,
      'en': `import { Keypair } from "@solana/web3.js";

// Generate a new keypair
const keypair = Keypair.generate();
console.log("Public key:", keypair.publicKey.toBase58());

// NEVER share your private key!
const keyData = JSON.stringify(Array.from(keypair.secretKey));
console.log("Keypair generated successfully!");`,
      'es': `import { Keypair } from "@solana/web3.js";

// Generar nuevo keypair
const keypair = Keypair.generate();
console.log("Clave p\u00fablica:", keypair.publicKey.toBase58());

// NUNCA compartas tu clave privada!
const keyData = JSON.stringify(Array.from(keypair.secretKey));
console.log("Keypair generado exitosamente!");`,
    },
  },
  {
    id: 'intro-4',
    title: {
      'pt-BR': 'Primeira transa\u00e7\u00e3o com @solana/web3.js',
      'en': 'First transaction with @solana/web3.js',
      'es': 'Primera transacci\u00f3n con @solana/web3.js',
    },
    course: COURSE_TITLE,
    xp: 150,
    duration: 35,
    completed: false,
    content: {
      'pt-BR': `# Primeira Transa\u00e7\u00e3o

## Criando uma Transfer\u00eancia

Vamos enviar SOL de uma carteira para outra usando o **@solana/web3.js**.

## Instru\u00e7\u00f5es

Uma transa\u00e7\u00e3o Solana cont\u00e9m uma ou mais **instru\u00e7\u00f5es**. Cada instru\u00e7\u00e3o especifica um programa, as contas envolvidas e os dados.

## Confirma\u00e7\u00e3o

Ap\u00f3s enviar, use **confirmTransaction** para aguardar a confirma\u00e7\u00e3o do validador. O commitment level pode ser: processed, confirmed ou finalized.`,
      'en': `# First Transaction

## Creating a Transfer

Let\u2019s send SOL from one wallet to another using **@solana/web3.js**.

## Instructions

A Solana transaction contains one or more **instructions**. Each instruction specifies a program, the accounts involved, and the data.

## Confirmation

After sending, use **confirmTransaction** to wait for validator confirmation. Commitment levels: processed, confirmed, or finalized.`,
      'es': `# Primera Transacci\u00f3n

## Creando una Transferencia

Vamos a enviar SOL de una billetera a otra usando **@solana/web3.js**.

## Instrucciones

Una transacci\u00f3n Solana contiene una o m\u00e1s **instrucciones**. Cada instrucci\u00f3n especifica un programa, las cuentas involucradas y los datos.

## Confirmaci\u00f3n

Despu\u00e9s de enviar, usa **confirmTransaction** para esperar la confirmaci\u00f3n del validador. Niveles: processed, confirmed o finalized.`,
    },
    starterCode: {
      'pt-BR': `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function transferirSOL() {
  // Criar remetente e destinat\u00e1rio
  const sender = Keypair.generate();
  const receiver = Keypair.generate();

  // Airdrop para o remetente
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Criar e enviar transa\u00e7\u00e3o
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver.publicKey,
      lamports: LAMPORTS_PER_SOL / 2,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log("Transa\u00e7\u00e3o confirmada:", sig);
}

transferirSOL();`,
      'en': `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function transferSOL() {
  // Create sender and receiver
  const sender = Keypair.generate();
  const receiver = Keypair.generate();

  // Airdrop to the sender
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Create and send transaction
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver.publicKey,
      lamports: LAMPORTS_PER_SOL / 2,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log("Transaction confirmed:", sig);
}

transferSOL();`,
      'es': `import { Connection, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function transferirSOL() {
  // Crear remitente y destinatario
  const sender = Keypair.generate();
  const receiver = Keypair.generate();

  // Airdrop para el remitente
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Crear y enviar transacci\u00f3n
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: receiver.publicKey,
      lamports: LAMPORTS_PER_SOL / 2,
    })
  );

  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log("Transacci\u00f3n confirmada:", sig);
}

transferirSOL();`,
    },
  },
  {
    id: 'intro-5',
    title: {
      'pt-BR': 'Token Program: criar e transferir tokens SPL',
      'en': 'Token Program: create and transfer SPL tokens',
      'es': 'Token Program: crear y transferir tokens SPL',
    },
    course: COURSE_TITLE,
    xp: 150,
    duration: 40,
    completed: false,
    content: {
      'pt-BR': `# Token Program

## Tokens SPL

O **SPL Token Program** \u00e9 o padr\u00e3o para tokens fung\u00edveis e n\u00e3o fung\u00edveis no Solana. Cada token tem um **Mint** (defini\u00e7\u00e3o) e m\u00faltiplas **Token Accounts** (saldos).

## Criando um Mint

Para criar um novo token, voc\u00ea precisa criar uma conta Mint com supply, decimals e mint authority definidos.

## Transfer\u00eancia

Transfer\u00eancias de tokens SPL s\u00e3o feitas entre Token Accounts, n\u00e3o entre wallets diretamente.`,
      'en': `# Token Program

## SPL Tokens

The **SPL Token Program** is the standard for fungible and non-fungible tokens on Solana. Each token has a **Mint** (definition) and multiple **Token Accounts** (balances).

## Creating a Mint

To create a new token, you need to create a Mint account with supply, decimals, and mint authority defined.

## Transfers

SPL token transfers happen between Token Accounts, not directly between wallets.`,
      'es': `# Token Program

## Tokens SPL

El **SPL Token Program** es el est\u00e1ndar para tokens fungibles y no fungibles en Solana. Cada token tiene un **Mint** (definici\u00f3n) y m\u00faltiples **Token Accounts** (saldos).

## Creando un Mint

Para crear un nuevo token, necesitas crear una cuenta Mint con supply, decimals y mint authority definidos.

## Transferencias

Las transferencias de tokens SPL se hacen entre Token Accounts, no directamente entre billeteras.`,
    },
    starterCode: {
      'pt-BR': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function criarToken() {
  const payer = Keypair.generate();
  await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);

  // Criar o mint do token
  const mint = await createMint(connection, payer, payer.publicKey, null, 9);
  console.log("Mint criado:", mint.toBase58());

  // Criar token account e mintar tokens
  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, tokenAccount.address, payer, 1000 * 1e9);
  console.log("Tokens mintados com sucesso!");
}

criarToken();`,
      'en': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function createToken() {
  const payer = Keypair.generate();
  await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);

  // Create the token mint
  const mint = await createMint(connection, payer, payer.publicKey, null, 9);
  console.log("Mint created:", mint.toBase58());

  // Create token account and mint tokens
  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, tokenAccount.address, payer, 1000 * 1e9);
  console.log("Tokens minted successfully!");
}

createToken();`,
      'es': `import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function crearToken() {
  const payer = Keypair.generate();
  await connection.requestAirdrop(payer.publicKey, 2 * LAMPORTS_PER_SOL);

  // Crear el mint del token
  const mint = await createMint(connection, payer, payer.publicKey, null, 9);
  console.log("Mint creado:", mint.toBase58());

  // Crear token account y mintear tokens
  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, tokenAccount.address, payer, 1000 * 1e9);
  console.log("Tokens minteados exitosamente!");
}

crearToken();`,
    },
  },
  {
    id: 'intro-6',
    title: {
      'pt-BR': 'PDAs: Program Derived Addresses explicados',
      'en': 'PDAs: Program Derived Addresses explained',
      'es': 'PDAs: Program Derived Addresses explicados',
    },
    course: COURSE_TITLE,
    xp: 150,
    duration: 35,
    completed: false,
    content: {
      'pt-BR': `# Program Derived Addresses (PDAs)

## O que s\u00e3o PDAs?

PDAs s\u00e3o endere\u00e7os derivados deterministicamente a partir de **seeds** e um **program ID**. Eles n\u00e3o t\u00eam chave privada, ent\u00e3o s\u00f3 o programa pode "assinar" por eles.

## Seeds e Bumps

Seeds s\u00e3o bytes arbitr\u00e1rios usados para derivar o endere\u00e7o. O **bump** garante que o endere\u00e7o n\u00e3o caia na curva el\u00edptica (n\u00e3o tenha chave privada v\u00e1lida).

## Casos de uso

- Armazenar dados por usu\u00e1rio (seed = wallet pubkey)
- Criar contas \u00fanicas por par de par\u00e2metros
- Assinar CPIs em nome do programa`,
      'en': `# Program Derived Addresses (PDAs)

## What are PDAs?

PDAs are addresses derived deterministically from **seeds** and a **program ID**. They have no private key, so only the owning program can "sign" for them.

## Seeds and Bumps

Seeds are arbitrary bytes used to derive the address. The **bump** ensures the address falls off the elliptic curve (no valid private key exists).

## Use Cases

- Store per-user data (seed = wallet pubkey)
- Create unique accounts per parameter pair
- Sign CPIs on behalf of the program`,
      'es': `# Program Derived Addresses (PDAs)

## \u00bfQu\u00e9 son las PDAs?

Las PDAs son direcciones derivadas determin\u00edsticamente a partir de **seeds** y un **program ID**. No tienen clave privada, as\u00ed que solo el programa puede "firmar" por ellas.

## Seeds y Bumps

Las seeds son bytes arbitrarios usados para derivar la direcci\u00f3n. El **bump** asegura que la direcci\u00f3n no caiga en la curva el\u00edptica (no exista clave privada v\u00e1lida).

## Casos de uso

- Almacenar datos por usuario (seed = wallet pubkey)
- Crear cuentas \u00fanicas por par de par\u00e1metros
- Firmar CPIs en nombre del programa`,
    },
    starterCode: {
      'pt-BR': `import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

// Derivar PDA a partir de seeds
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from("intro-solana")],
  PROGRAM_ID
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);

// PDAs s\u00e3o determin\u00edsticas \u2014 mesmas seeds = mesmo endere\u00e7o`,
      'en': `import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

// Derive PDA from seeds
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from("intro-solana")],
  PROGRAM_ID
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);

// PDAs are deterministic \u2014 same seeds = same address`,
      'es': `import { Connection, PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf");

// Derivar PDA a partir de seeds
const [pda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("enrollment"), Buffer.from("intro-solana")],
  PROGRAM_ID
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);

// Las PDAs son determin\u00edsticas \u2014 mismas seeds = misma direcci\u00f3n`,
    },
  },
  {
    id: 'intro-7',
    title: {
      'pt-BR': 'Desafio: Deploy de Hello World em Rust',
      'en': 'Challenge: Deploy Hello World in Rust',
      'es': 'Desaf\u00edo: Deploy de Hello World en Rust',
    },
    course: COURSE_TITLE,
    xp: 150,
    duration: 45,
    completed: false,
    content: {
      'pt-BR': `# Deploy de Hello World

## Programa Solana em Rust

Vamos criar e fazer deploy de um programa b\u00e1sico em Rust que registra uma mensagem no log.

## Estrutura do Programa

Todo programa Solana precisa de um **entrypoint** que recebe o program_id, as contas e os dados da instru\u00e7\u00e3o.

## Deploy em Devnet

Use o Solana CLI para compilar e fazer deploy do programa na rede devnet. O programa receber\u00e1 um Program ID \u00fanico.`,
      'en': `# Hello World Deploy

## Solana Program in Rust

Let\u2019s create and deploy a basic Rust program that logs a message.

## Program Structure

Every Solana program needs an **entrypoint** that receives the program_id, accounts, and instruction data.

## Deploying to Devnet

Use the Solana CLI to compile and deploy the program to devnet. The program will receive a unique Program ID.`,
      'es': `# Deploy de Hello World

## Programa Solana en Rust

Vamos a crear y hacer deploy de un programa b\u00e1sico en Rust que registra un mensaje en el log.

## Estructura del Programa

Todo programa Solana necesita un **entrypoint** que recibe el program_id, las cuentas y los datos de la instrucci\u00f3n.

## Deploy en Devnet

Usa el Solana CLI para compilar y hacer deploy del programa en la red devnet. El programa recibir\u00e1 un Program ID \u00fanico.`,
    },
    starterCode: {
      'pt-BR': `// Programa Solana em Rust (referencia)
// use solana_program::{
//     account_info::AccountInfo,
//     entrypoint,
//     entrypoint::ProgramResult,
//     msg,
//     pubkey::Pubkey,
// };
//
// entrypoint!(process_instruction);
//
// pub fn process_instruction(
//     program_id: &Pubkey,
//     _accounts: &[AccountInfo],
//     _instruction_data: &[u8],
// ) -> ProgramResult {
//     msg!("Ola do programa Solana!");
//     Ok(())
// }

// Para fazer deploy:
// solana program deploy target/deploy/hello_world.so
console.log("Veja o c\u00f3digo Rust comentado acima");`,
      'en': `// Solana program in Rust (reference)
// use solana_program::{
//     account_info::AccountInfo,
//     entrypoint,
//     entrypoint::ProgramResult,
//     msg,
//     pubkey::Pubkey,
// };
//
// entrypoint!(process_instruction);
//
// pub fn process_instruction(
//     program_id: &Pubkey,
//     _accounts: &[AccountInfo],
//     _instruction_data: &[u8],
// ) -> ProgramResult {
//     msg!("Hello from Solana program!");
//     Ok(())
// }

// To deploy:
// solana program deploy target/deploy/hello_world.so
console.log("See the Rust code commented above");`,
      'es': `// Programa Solana en Rust (referencia)
// use solana_program::{
//     account_info::AccountInfo,
//     entrypoint,
//     entrypoint::ProgramResult,
//     msg,
//     pubkey::Pubkey,
// };
//
// entrypoint!(process_instruction);
//
// pub fn process_instruction(
//     program_id: &Pubkey,
//     _accounts: &[AccountInfo],
//     _instruction_data: &[u8],
// ) -> ProgramResult {
//     msg!("Hola desde el programa Solana!");
//     Ok(())
// }

// Para hacer deploy:
// solana program deploy target/deploy/hello_world.so
console.log("Ve el c\u00f3digo Rust comentado arriba");`,
    },
  },
  {
    id: 'intro-8',
    title: {
      'pt-BR': 'Projeto final: Mini token faucet',
      'en': 'Final project: Mini token faucet',
      'es': 'Proyecto final: Mini token faucet',
    },
    course: COURSE_TITLE,
    xp: 100,
    duration: 30,
    completed: false,
    content: {
      'pt-BR': `# Projeto Final: Mini Token Faucet

## Objetivo

Construir um faucet simples que distribui tokens SPL para qualquer carteira que solicitar.

## Componentes

1. **Mint** do token criado antecipadamente
2. **Token Account** do faucet com supply inicial
3. **Frontend** com bot\u00e3o "Solicitar Tokens"
4. **L\u00f3gica** de transfer\u00eancia usando @solana/web3.js

## Parab\u00e9ns!

Ao completar este projeto, voc\u00ea ter\u00e1 constru\u00eddo sua primeira dApp completa no Solana!`,
      'en': `# Final Project: Mini Token Faucet

## Objective

Build a simple faucet that distributes SPL tokens to any wallet that requests them.

## Components

1. Token **Mint** created in advance
2. Faucet **Token Account** with initial supply
3. **Frontend** with a "Request Tokens" button
4. Transfer **logic** using @solana/web3.js

## Congratulations!

By completing this project, you\u2019ll have built your first complete dApp on Solana!`,
      'es': `# Proyecto Final: Mini Token Faucet

## Objetivo

Construir un faucet simple que distribuya tokens SPL a cualquier billetera que los solicite.

## Componentes

1. **Mint** del token creado de antemano
2. **Token Account** del faucet con supply inicial
3. **Frontend** con bot\u00f3n "Solicitar Tokens"
4. **L\u00f3gica** de transferencia usando @solana/web3.js

## \u00a1Felicidades!

Al completar este proyecto, \u00a1habr\u00e1s construido tu primera dApp completa en Solana!`,
    },
    starterCode: {
      'pt-BR': `import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function faucet(recipientAddress: string) {
  // Configurar o faucet (em produ\u00e7\u00e3o, use uma chave segura)
  const faucetKeypair = Keypair.generate();

  const recipient = new PublicKey(recipientAddress);
  // TODO: Criar mint, token accounts, e transferir tokens
  console.log("Faucet pronto! Tokens enviados para:", recipient.toBase58());
}

// Testar com um endere\u00e7o
faucet("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");`,
      'en': `import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function faucet(recipientAddress: string) {
  // Set up the faucet (in production, use a secure key)
  const faucetKeypair = Keypair.generate();

  const recipient = new PublicKey(recipientAddress);
  // TODO: Create mint, token accounts, and transfer tokens
  console.log("Faucet ready! Tokens sent to:", recipient.toBase58());
}

// Test with an address
faucet("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");`,
      'es': `import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

const connection = new Connection("https://api.devnet.solana.com", "confirmed");

async function faucet(recipientAddress: string) {
  // Configurar el faucet (en producci\u00f3n, usa una clave segura)
  const faucetKeypair = Keypair.generate();

  const recipient = new PublicKey(recipientAddress);
  // TODO: Crear mint, token accounts y transferir tokens
  console.log("Faucet listo! Tokens enviados a:", recipient.toBase58());
}

// Probar con una direcci\u00f3n
faucet("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");`,
    },
  },
];

const LESSON_SIDEBAR = LESSONS;

type TabType = 'content' | 'editor';

export default function LessonPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('lesson');
  const tCommon = useTranslations('common');
  const lessonId = (params.id as string) || 'intro-1';

  const currentIndex = LESSON_SIDEBAR.findIndex((l) => l.id === lessonId);
  const lesson = LESSON_SIDEBAR[currentIndex] ?? LESSON_SIDEBAR[0];
  const prevLesson = LESSON_SIDEBAR[currentIndex - 1];
  const nextLesson = LESSON_SIDEBAR[currentIndex + 1];

  const [code, setCode] = useState(L(lesson.starterCode, locale));
  const [completed, setCompleted] = useState(lesson.completed);
  const [activeTab, setActiveTab] = useState<TabType>('content');
  const [language, setLanguage] = useState('typescript');
  const [completing, setCompleting] = useState(false);
  const { publicKey } = useWallet();

  const handleComplete = useCallback(async () => {
    if (completed || completing) return;
    setCompleting(true);

    // If wallet is connected, persist completion on-chain via API
    if (publicKey) {
      try {
        const res = await fetch('/api/complete-lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: 'intro-solana',
            lessonIndex: currentIndex,
            learner: publicKey.toBase58(),
          }),
        });
        if (!res.ok) {
          console.error('Lesson completion API error:', await res.text());
        }
      } catch (err) {
        console.error('Failed to persist lesson completion:', err);
      }
    }

    setCompleted(true);
    setCompleting(false);
  }, [completed, completing, publicKey, currentIndex]);

  const completedCount = LESSON_SIDEBAR.filter((l) => l.completed).length;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-950 text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div data-testid="lesson-sidebar" className="hidden lg:flex w-72 flex-col border-r border-gray-800 bg-gray-900/60 overflow-y-auto shrink-0">
        <div className="p-4 border-b border-gray-800">
          <Link
            href={localePath(locale, '/courses/intro-solana')}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-purple-400 transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {L(COURSE_TITLE, locale)}
          </Link>
          <h3 className="text-sm font-semibold text-white">{t('course_lessons')}</h3>
          <div className="mt-1 text-xs text-gray-500">
            {completedCount}/{LESSON_SIDEBAR.length} {t('completed_count')}
          </div>
        </div>
        <div className="flex-1 p-2">
          {LESSON_SIDEBAR.map((l, i) => (
            <Link
              key={l.id}
              href={localePath(locale, `/lessons/${l.id}`)}
              className={cn(
                'flex items-start gap-2.5 rounded-lg px-3 py-2.5 mb-0.5 text-xs transition-all',
                l.id === lesson.id
                  ? 'bg-purple-900/40 border border-purple-700/50 text-purple-200'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {l.completed ? (
                  <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                ) : (
                  <Circle className={cn('h-3.5 w-3.5', l.id === lesson.id ? 'text-purple-400' : 'text-gray-600')} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className={cn('block leading-snug', l.id === lesson.id ? 'font-medium' : '')}>
                  {i + 1}. {L(l.title, locale)}
                </span>
                <div className="flex items-center gap-2 mt-0.5 text-gray-600">
                  <span>{l.duration}min</span>
                  <span className="text-yellow-500/70">+{l.xp} XP</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar with tabs */}
        <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900/80 px-4 py-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('content')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'content'
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              {t('content_tab')}
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                activeTab === 'editor'
                  ? 'bg-purple-900/50 text-purple-300'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              {t('editor_tab')}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{lesson.duration}min</span>
            <div className="flex items-center gap-1 text-xs font-semibold text-yellow-400">
              <Zap className="h-3.5 w-3.5" />
              +{lesson.xp} XP
            </div>
          </div>
        </div>

        {/* Content split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: lesson content (always visible on desktop, tabbed on mobile) */}
          <div className={cn(
            'flex flex-col border-r border-gray-800 overflow-y-auto',
            'w-full lg:w-3/5',
            activeTab === 'editor' ? 'hidden lg:flex' : 'flex'
          )}>
            <div className="p-6 flex-1">
              <h1 className="mb-1 text-xl font-bold text-white leading-tight">{L(lesson.title, locale)}</h1>
              <p className="mb-6 text-xs text-gray-500">{L(lesson.course, locale)}</p>

              {/* Render markdown-ish content */}
              <div className="prose-lesson space-y-4">
                {L(lesson.content, locale).split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-2">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-purple-300 mt-6 mb-2">{line.slice(3)}</h2>;
                  if (line.startsWith('```')) return null;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm text-gray-300 list-disc">{line.slice(2)}</li>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  // Bold text
                  const parts = line.split(/\*\*(.*?)\*\*/g);
                  if (parts.length > 1) {
                    return (
                      <p key={i} className="text-sm text-gray-300 leading-relaxed">
                        {parts.map((p, j) => j % 2 === 0 ? p : <strong key={j} className="text-white">{p}</strong>)}
                      </p>
                    );
                  }
                  return <p key={i} className="text-sm text-gray-300 leading-relaxed">{line}</p>;
                })}
              </div>

              {/* Code block example */}
              <div className="mt-6 rounded-xl overflow-hidden border border-gray-700">
                <div className="flex items-center justify-between bg-gray-800 px-4 py-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500/70" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                    <div className="h-3 w-3 rounded-full bg-green-500/70" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">typescript</span>
                </div>
                <div className="bg-gray-900 p-4">
                  <pre className="text-xs text-gray-300 font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {`import { Connection, PublicKey } from "@solana/web3.js";

const connection = new Connection("https://api.devnet.solana.com");
const pubkey = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

const balance = await connection.getBalance(pubkey);
console.log(\`Saldo: \${balance / 1e9} SOL\`);`}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Monaco Editor */}
          <div className={cn(
            'flex flex-col',
            'w-full lg:w-2/5',
            activeTab === 'content' ? 'hidden lg:flex' : 'flex'
          )}>
            <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2 shrink-0">
              <span className="text-xs text-gray-400 font-medium">{t('playground')}</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="rust">Rust</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>
            <div className="flex-1 min-h-0">
              <MonacoEditor
                height="100%"
                defaultLanguage={language}
                language={language}
                value={code}
                onChange={(v) => setCode(v ?? '')}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  minimap: { enabled: false },
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                  fontFamily: '"Geist Mono", "Fira Code", monospace',
                  fontLigatures: true,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom navigation bar */}
        <div className="shrink-0 border-t border-gray-800 bg-gray-900/80 px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {prevLesson ? (
              <Link
                href={localePath(locale, `/lessons/${prevLesson.id}`)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-medium text-gray-300 hover:border-gray-600 hover:text-white transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                {t('previous')}
              </Link>
            ) : <div />}

            <button
              onClick={handleComplete}
              disabled={completing}
              className={cn(
                'flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold transition-all',
                completed
                  ? 'bg-green-800/50 border border-green-700 text-green-300 cursor-default'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:scale-105'
              )}
            >
              {completed ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t('already_complete')}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  {t('mark_complete')} (+{lesson.xp} XP)
                </>
              )}
            </button>

            {nextLesson ? (
              <Link
                href={localePath(locale, `/lessons/${nextLesson.id}`)}
                className="flex items-center gap-1.5 rounded-xl bg-gray-700 px-3 py-2 text-xs font-medium text-gray-200 hover:bg-gray-600 transition-all"
              >
                {tCommon('next')}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                href={localePath(locale, '/courses/intro-solana')}
                className="flex items-center gap-1.5 rounded-xl bg-green-700 px-3 py-2 text-xs font-medium text-white hover:bg-green-600 transition-all"
              >
                {t('finish')}
                <BookOpen className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
