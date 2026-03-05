// Course 4: Solana CLI na prática
// Course 5: Rust para Solana
// Course 6: PDAs e contas no Solana
// Lesson IDs: cli-l1 – cli-l6, rs-l1 – rs-l7, pda-l1 – pda-l7

import type { Course } from "./courses";

export const course4: Course = {
  id: "4",
  slug: "solana-cli-workshop",
  title: "Solana CLI na prática",
  description: "Configure o ambiente, crie contas e envie transações via CLI.",
  longDescription:
    "Workshop hands-on com Solana CLI: instalação, keypairs, airdrop, transferências e exploração de transações na blockchain.",
  difficulty: "beginner",
  duration: "short",
  totalDurationMinutes: 135,
  xpTotal: 230,
  thumbnail: "/courses/solana-cli-workshop.png",
  instructor: {
    name: "Kuka",
    avatar: "/instructors/kuka.png",
    role: "Instrutor",
  },
  instructorSlug: "superteam-br",
  track: "Solana Fundamentals",
  modules: [
    {
      id: "m4-1",
      title: "Configuração",
      lessons: [
        {
          id: "cli-l1",
          title: "Instalando o Solana CLI",
          slug: "instalando-cli",
          type: "content",
          durationMinutes: 20,
          xpReward: 30,
          content: `# Instalando o Solana CLI

O **Solana CLI** é a ferramenta de linha de comando oficial para interagir com a blockchain Solana. Com ela você pode criar carteiras, enviar transações, fazer deploy de programas e muito mais.

## Instalação no macOS e Linux

A forma mais simples é usando o script de instalação oficial da Anza (mantenedora do validador Agave):

\`\`\`bash
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
\`\`\`

Esse script baixa os binários pré-compilados e os instala em \`~/.local/share/solana/install/active_release/bin\`.

### Configurando o PATH

Após a instalação, adicione o diretório ao seu PATH. Edite seu \`~/.bashrc\`, \`~/.zshrc\` ou equivalente:

\`\`\`bash
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
\`\`\`

Recarregue o terminal:

\`\`\`bash
source ~/.zshrc   # ou ~/.bashrc
\`\`\`

## Instalação no Windows

No Windows, abra o **PowerShell** como administrador e execute:

\`\`\`powershell
cmd /c "curl https://release.anza.xyz/stable/solana-install-init-x86_64-pc-windows-msvc.exe --output C:\\solana-install-tmp\\solana-install-init.exe --create-dirs"
C:\\solana-install-tmp\\solana-install-init.exe stable
\`\`\`

Alternativamente, use o **WSL2** (Windows Subsystem for Linux) e siga as instruções de Linux.

## Verificando a instalação

Confirme que tudo está funcionando:

\`\`\`bash
solana --version
# solana-cli 1.18.x (src:xxxxxxx; feat:xxxxxxxxxx, client:Agave)
\`\`\`

Outros comandos úteis para verificar:

\`\`\`bash
solana-keygen --version
solana-test-validator --version
\`\`\`

## Atualizando

Para atualizar para a versão mais recente:

\`\`\`bash
solana-install update
\`\`\`

## Troubleshooting

- **Comando não encontrado**: verifique se o PATH está configurado corretamente
- **Permissão negada**: no Linux/macOS, não use \`sudo\` — a instalação é no diretório do usuário
- **Versão antiga**: execute \`solana-install update\` para atualizar
- **WSL2 no Windows**: se tiver problemas com o instalador nativo, prefira WSL2
- **Firewall/proxy**: o script precisa acessar \`release.anza.xyz\` — verifique se seu firewall permite`,
          exercise: {
            question:
              "Qual comando verifica se o Solana CLI foi instalado corretamente?",
            options: [
              "solana check",
              "solana --version",
              "solana verify",
              "solana-install status",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "cli-l2",
          title: "Configurando a rede",
          slug: "configurando-rede",
          type: "content",
          durationMinutes: 20,
          xpReward: 30,
          content: `# Configurando a rede

O Solana possui **três redes principais** (clusters) e o CLI permite alternar entre elas facilmente.

## Clusters disponíveis

| Cluster | URL | Uso |
|---|---|---|
| **Devnet** | \`https://api.devnet.solana.com\` | Desenvolvimento e testes |
| **Testnet** | \`https://api.testnet.solana.com\` | Testes de validadores |
| **Mainnet-beta** | \`https://api.mainnet-beta.solana.com\` | Produção |

## Configurando o cluster

Use o comando \`solana config set\` com a flag \`-u\` (ou \`--url\`):

\`\`\`bash
# Conectar à devnet (recomendado para desenvolvimento)
solana config set -u devnet

# Conectar à testnet
solana config set -u testnet

# Conectar à mainnet
solana config set -u mainnet-beta

# Usar URL completa
solana config set --url https://api.devnet.solana.com
\`\`\`

## RPCs customizados

Os RPCs públicos do Solana possuem **rate limits** rigorosos. Para desenvolvimento sério, use um provedor de RPC dedicado:

### Helius

\`\`\`bash
solana config set --url https://devnet.helius-rpc.com/?api-key=SUA_API_KEY
\`\`\`

### QuickNode

\`\`\`bash
solana config set --url https://your-endpoint.solana-devnet.quiknode.pro/TOKEN/
\`\`\`

### Triton (via Alchemy)

\`\`\`bash
solana config set --url https://solana-devnet.g.alchemy.com/v2/SUA_KEY
\`\`\`

## Verificando a configuração atual

\`\`\`bash
solana config get
\`\`\`

Saída esperada:

\`\`\`
Config File: /home/user/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
WebSocket URL: wss://api.devnet.solana.com/ (computed)
Keypair Path: /home/user/.config/solana/id.json
Commitment: confirmed
\`\`\`

## Dica: Localhost

Para testes locais, rode o validador de teste e configure:

\`\`\`bash
solana-test-validator  # em outro terminal
solana config set -u localhost
# URL será http://127.0.0.1:8899
\`\`\`

O validador local é **muito mais rápido** e não tem rate limits — ideal para desenvolvimento iterativo.`,
          exercise: {
            question:
              "Qual cluster é mais recomendado para desenvolvimento e testes no Solana?",
            options: [
              "Mainnet-beta, pois é o ambiente real",
              "Testnet, pois é exclusiva para testes",
              "Devnet, pois é projetada para desenvolvimento com SOL grátis",
              "Localhost, pois é a única opção gratuita",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "cli-l3",
          title: "Keypairs e carteiras",
          slug: "keypairs-carteiras",
          type: "content",
          durationMinutes: 25,
          xpReward: 40,
          content: `# Keypairs e Carteiras

No Solana, toda conta é identificada por um **par de chaves criptográficas** (keypair): uma chave pública (endereço) e uma chave privada (para assinar transações).

## Gerando um novo keypair

\`\`\`bash
solana-keygen new
\`\`\`

Esse comando:

1. Gera um par de chaves Ed25519
2. Pede uma **passphrase** (opcional, mas recomendada)
3. Mostra a **seed phrase** (12 ou 24 palavras) — **anote e guarde com segurança!**
4. Salva o keypair em \`~/.config/solana/id.json\`

Saída esperada:

\`\`\`
Generating a new keypair
For added security, enter a BIP39 passphrase
NOTE! This passphrase improves security of the recovery seed phrase
BIP39 Passphrase (empty for none):
Wrote new keypair to /home/user/.config/solana/id.json
=============================================================
pubkey: 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
=============================================================
Save this seed phrase to recover your keypair:
word1 word2 word3 ... word12
=============================================================
\`\`\`

## Salvando em outro arquivo

Use a flag \`--outfile\` para gerar keypairs em localizações específicas:

\`\`\`bash
solana-keygen new --outfile ~/wallets/minha-carteira.json
solana-keygen new --outfile ./deploy-keypair.json
\`\`\`

## Endereços vanity (personalizados)

O comando \`grind\` permite gerar endereços que começam com um prefixo específico:

\`\`\`bash
# Gerar endereço que começa com "Sol"
solana-keygen grind --starts-with Sol:1

# Gerar endereço que começa com "ABC"
solana-keygen grind --starts-with ABC:1
\`\`\`

> **Atenção**: quanto maior o prefixo, mais tempo leva. 3 caracteres pode levar segundos, 5+ pode levar horas.

## Exibindo o endereço público

\`\`\`bash
# Endereço do keypair padrão
solana address

# Endereço de um arquivo específico
solana address -k ~/wallets/minha-carteira.json

# Verificar keypair completo
solana-keygen verify <PUBKEY> ~/wallets/minha-carteira.json
\`\`\`

## Recuperando de seed phrase

\`\`\`bash
solana-keygen recover --outfile ~/wallets/recovered.json
# Cole a seed phrase quando solicitado
\`\`\`

## Boas práticas de segurança

- **Nunca compartilhe** sua chave privada ou seed phrase
- **Nunca commite** arquivos \`.json\` de keypair no Git (adicione ao \`.gitignore\`)
- Use **passphrase** para adicionar uma camada extra de proteção
- Para produção, considere **hardware wallets** (Ledger)
- Mantenha **backups** da seed phrase em local seguro e offline
- Use keypairs diferentes para **desenvolvimento** e **produção**`,
          exercise: {
            question:
              "Qual flag do solana-keygen new permite salvar o keypair em um arquivo específico?",
            options: ["--file", "--output", "--outfile", "--save-to"],
            correctIndex: 2,
          },
        },
      ],
    },
    {
      id: "m4-2",
      title: "Operações",
      lessons: [
        {
          id: "cli-l4",
          title: "Airdrop e saldos",
          slug: "airdrop-saldos",
          type: "content",
          durationMinutes: 20,
          xpReward: 30,
          content: `# Airdrop e Saldos

Na **devnet** e **testnet** do Solana, você pode solicitar SOL grátis para testes usando o **airdrop**. Isso é essencial para desenvolvimento, pois toda transação requer SOL para pagar taxas.

## Solicitando airdrop

\`\`\`bash
# Solicitar 2 SOL (padrão)
solana airdrop 2

# Solicitar 1 SOL
solana airdrop 1

# Airdrop para um endereço específico
solana airdrop 2 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7
\`\`\`

> **Nota**: o airdrop só funciona na **devnet** e **testnet**. Na mainnet, você precisa comprar SOL.

## Verificando saldo

\`\`\`bash
# Saldo do keypair padrão
solana balance

# Saldo de um endereço específico
solana balance 7nHfERsJ3mVUp8Gk4GVrGGd5dMTJMGKWpEF4mRYPjQo7

# Saldo em lamports
solana balance --lamports
\`\`\`

## Lamports: a menor unidade

Assim como o Bitcoin tem satoshis e o Ethereum tem wei, o Solana usa **lamports**:

| Unidade | Valor |
|---|---|
| 1 SOL | 1.000.000.000 lamports |
| 1 lamport | 0,000000001 SOL |

\`\`\`bash
# A constante em código
LAMPORTS_PER_SOL = 1_000_000_000
\`\`\`

Na prática:

\`\`\`
2.5 SOL = 2_500_000_000 lamports
0.001 SOL = 1_000_000 lamports
Taxa típica = 5_000 lamports = 0.000005 SOL
\`\`\`

## Rate limits do airdrop

O faucet público da devnet possui limites:

- **Máximo por request**: 2 SOL (na devnet) ou 1 SOL (na testnet)
- **Cooldown**: pode haver espera entre requests consecutivos
- **IP-based**: o rate limit é por endereço IP

### Alternativas quando o faucet está congestionado

1. **Faucet web**: [faucet.solana.com](https://faucet.solana.com)
2. **Validador local**: \`solana-test-validator\` — SOL infinito, sem rate limits
3. **Programático**: use \`connection.requestAirdrop()\` no código

\`\`\`bash
# Se o airdrop falhar, tente o validador local
solana-test-validator &
solana config set -u localhost
solana airdrop 100  # funciona sem limite no localhost
\`\`\`

## Verificando conta completa

Para ver todos os detalhes de uma conta:

\`\`\`bash
solana account <ENDEREÇO>
\`\`\`

Isso mostra: saldo, owner, tamanho dos dados, se é executável, e o rent epoch.`,
          exercise: {
            question: "Quantos lamports equivalem a 1 SOL?",
            options: [
              "1.000.000 (um milhão)",
              "1.000.000.000 (um bilhão)",
              "100.000.000 (cem milhões)",
              "10.000.000.000 (dez bilhões)",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "cli-l5",
          title: "Transferindo SOL",
          slug: "transferindo-sol",
          type: "challenge",
          durationMinutes: 30,
          xpReward: 50,
          content: `# Transferindo SOL

Transferir SOL é uma das operações mais fundamentais na blockchain Solana. Vamos aprender tanto pelo CLI quanto programaticamente.

## Transferência via CLI

O comando \`solana transfer\` envia SOL de sua carteira padrão para outro endereço:

\`\`\`bash
# Sintaxe básica
solana transfer <DESTINATARIO> <QUANTIDADE>

# Exemplo: enviar 0.5 SOL
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5

# Com confirmação verbose
solana transfer 9aE476sH92Vz7DMPyq5WLPkrKWivxeuTKEFKd2sZZcde 0.5 --verbose
\`\`\`

## Verificando a transação

Após a transferência, o CLI retorna uma **assinatura** (signature/txid):

\`\`\`bash
# Verificar status da transação
solana confirm <SIGNATURE>

# Ver detalhes completos
solana transaction-history <ENDEREÇO>
\`\`\`

## Flags úteis

\`\`\`bash
# Usar keypair específico como sender
solana transfer <DEST> 1 --keypair ~/wallets/outra-carteira.json

# Permitir funding do fee payer
solana transfer <DEST> 1 --allow-unfunded-recipient

# Transferir todos os SOL (deixando 0)
solana transfer <DEST> ALL
\`\`\`

## Transferência programática (TypeScript)

Usando \`@solana/web3.js\`, a transferência segue estes passos:

1. Criar uma **Connection** com o cluster
2. Construir a **instrução** via \`SystemProgram.transfer\`
3. Adicionar a instrução a uma **Transaction**
4. **Assinar e enviar** com \`sendAndConfirmTransaction\`

\`\`\`typescript
import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

async function transferSOL() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const sender = Keypair.generate();

  // Airdrop para o sender
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  const receiver = Keypair.generate();

  // Criar instrução de transferência
  const instruction = SystemProgram.transfer({
    fromPubkey: sender.publicKey,
    toPubkey: receiver.publicKey,
    lamports: 0.5 * LAMPORTS_PER_SOL,
  });

  // Montar e enviar transação
  const tx = new Transaction().add(instruction);
  const sig = await sendAndConfirmTransaction(connection, tx, [sender]);
  console.log('Transação confirmada:', sig);
}
\`\`\`

## Entendendo a assinatura

Cada transação no Solana gera uma **assinatura única** (base58, 88 caracteres). Essa assinatura serve como:

- **Identificador único** da transação
- **Prova criptográfica** de que o sender autorizou
- **Chave de busca** no Explorer`,
          exercise: {
            question:
              "Qual programa do Solana é responsável por transferências de SOL nativas?",
            options: [
              "Token Program",
              "System Program",
              "Associated Token Account Program",
              "Stake Program",
            ],
            correctIndex: 1,
          },
          challenge: {
            prompt:
              "Complete o script TypeScript que transfere 0.5 SOL do sender para o receiver na devnet e imprime a assinatura da transação.",
            starterCode: `import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Sender
  const sender = Keypair.generate();
  const airdropSig = await connection.requestAirdrop(sender.publicKey, 2 * LAMPORTS_PER_SOL);
  await connection.confirmTransaction(airdropSig);

  // Receiver
  const receiver = Keypair.generate();
  console.log('Receiver:', receiver.publicKey.toBase58());

  // TODO: Criar a instrução de transferência de 0.5 SOL
  // Use SystemProgram.transfer({ fromPubkey, toPubkey, lamports })


  // TODO: Criar a transação e adicionar a instrução
  // Use new Transaction().add(...)


  // TODO: Enviar e confirmar a transação
  // Use sendAndConfirmTransaction(connection, tx, [sender])


  // TODO: Imprimir a assinatura da transação

}

main();`,
            language: "typescript",
            testCases: [
              {
                input: "SystemProgram.transfer",
                expected:
                  "SystemProgram.transfer({ fromPubkey: sender.publicKey, toPubkey: receiver.publicKey, lamports: 0.5 * LAMPORTS_PER_SOL })",
              },
              {
                input: "sendAndConfirmTransaction",
                expected:
                  "await sendAndConfirmTransaction(connection, tx, [sender])",
              },
            ],
          },
        },
        {
          id: "cli-l6",
          title: "Explorando transações",
          slug: "explorando-transacoes",
          type: "content",
          durationMinutes: 20,
          xpReward: 50,
          content: `# Explorando Transações

Depois de enviar uma transação, é fundamental saber como **verificar, explorar e debugar** o que aconteceu on-chain. O Solana oferece ferramentas via CLI e interfaces web.

## Confirmando transações via CLI

\`\`\`bash
# Verificar se uma transação foi confirmada
solana confirm <SIGNATURE>

# Exemplo
solana confirm 5VGR...abc123
# Retorna: Confirmed / Finalized / Not found
\`\`\`

Os níveis de confirmação no Solana:

- **processed**: recebida pelo líder atual (~400ms)
- **confirmed**: votada por supermaioria dos validadores (~1s)
- **finalized**: 31+ slots após confirmed — irreversível (~12s)

## Solana Explorer

O [Solana Explorer](https://explorer.solana.com) é a interface web oficial para explorar transações, contas e blocos.

### Pesquisando uma transação

1. Acesse [explorer.solana.com](https://explorer.solana.com)
2. Selecione a rede correta (Devnet, Testnet ou Mainnet)
3. Cole a **signature** da transação na barra de busca

### Informações disponíveis

A página de uma transação mostra:

- **Status**: Success ou Failed
- **Slot e timestamp**: quando foi processada
- **Fee**: taxa paga em lamports
- **Signers**: quem assinou a transação
- **Instructions**: lista de instruções executadas
- **Logs**: mensagens de log do programa
- **Accounts**: contas lidas e escritas

## Explorando contas via CLI

\`\`\`bash
# Ver detalhes de uma conta
solana account <ENDEREÇO>

# Saída inclui:
# - Balance (lamports e SOL)
# - Owner (programa dono da conta)
# - Data Length (bytes de dados armazenados)
# - Executable (se é um programa)
\`\`\`

## Histórico de transações

\`\`\`bash
# Últimas transações de um endereço
solana transaction-history <ENDEREÇO>

# Com limite
solana transaction-history <ENDEREÇO> --limit 5
\`\`\`

## Logs de programas

Para ver os logs detalhados de uma transação:

\`\`\`bash
solana logs             # stream de logs em tempo real
solana logs <PROGRAMA>  # logs apenas de um programa específico
\`\`\`

Exemplo de log:

\`\`\`
Program 11111111111111111111111111111111 invoke [1]
Program 11111111111111111111111111111111 success
\`\`\`

## Exploradores alternativos

- **Solscan**: [solscan.io](https://solscan.io) — interface rica com analytics
- **SolanaFM**: [solana.fm](https://solana.fm) — decodificação avançada de instruções
- **XRAY**: [xray.helius.xyz](https://xray.helius.xyz) — visualização detalhada por Helius

Cada explorador tem pontos fortes — Solscan é ótimo para tokens, SolanaFM para decodificar programas complexos, e XRAY para transações DeFi.`,
          exercise: {
            question:
              "Qual nível de confirmação no Solana garante que a transação é irreversível?",
            options: ["processed", "confirmed", "finalized", "committed"],
            correctIndex: 2,
          },
        },
      ],
    },
  ],
};

export const course5: Course = {
  id: "5",
  slug: "rust-para-solana",
  title: "Rust para Solana",
  description:
    "Sintaxe e conceitos de Rust necessários para programas on-chain.",
  longDescription:
    "Prepare-se para escrever programas Solana dominando variáveis, ownership, structs, enums, traits e tratamento de erros em Rust.",
  difficulty: "beginner",
  duration: "medium",
  totalDurationMinutes: 175,
  xpTotal: 280,
  thumbnail: "/courses/rust-para-solana.png",
  instructor: {
    name: "Ana Silva",
    avatar: "https://i.pravatar.cc/400?img=22",
    role: "Instrutora · Rust & Solana",
  },
  instructorSlug: "ana-silva",
  track: "Solana Fundamentals",
  modules: [
    {
      id: "m5-1",
      title: "Fundamentos Rust",
      lessons: [
        {
          id: "rs-l1",
          title: "Por que Rust para Solana?",
          slug: "por-que-rust",
          type: "content",
          durationMinutes: 20,
          xpReward: 30,
          content: `# Por que Rust para Solana?

Rust é a linguagem **principal** para escrever programas on-chain no Solana. Mas por que a Solana Labs escolheu Rust? Vamos entender as razões técnicas e práticas.

## Segurança de memória

Rust garante **segurança de memória em tempo de compilação** — sem null pointers, sem buffer overflows, sem data races. Isso é **crítico** para smart contracts onde bugs podem custar milhões:

\`\`\`rust
// Rust NÃO permite null pointers
// Em vez disso, usa Option<T>
let valor: Option<u64> = Some(42);
let nenhum: Option<u64> = None;

// Você é OBRIGADO a tratar o None
match valor {
    Some(v) => println!("Valor: {}", v),
    None => println!("Sem valor"),
}
\`\`\`

## Performance sem garbage collector

Rust não possui **garbage collector (GC)**. A memória é gerenciada pelo sistema de **ownership** em tempo de compilação:

- **Zero overhead**: sem pausas para GC (como em Go, Java ou JavaScript)
- **Previsível**: tempo de execução determinístico — essencial para blockchain
- **Eficiente**: controle fino sobre alocação e layout de memória

\`\`\`
Linguagem    | GC?   | Performance | Segurança
-------------|-------|-------------|----------
C/C++        | Não   | Alta        | Baixa
Java/Go      | Sim   | Média       | Média
Rust         | Não   | Alta        | Alta ✓
JavaScript   | Sim   | Baixa       | Média
\`\`\`

## Comparação com outras linguagens

### Rust vs Solidity

| Aspecto | Rust (Solana) | Solidity (Ethereum) |
|---|---|---|
| Modelo de execução | Programa on-chain reutilizável | Contrato com estado próprio |
| Velocidade | ~65k TPS | ~15 TPS |
| Custo médio | < $0.001 | $1 – $50+ |
| Ecossistema | Crescendo rapidamente | Maduro |

### Rust vs Move (Aptos/Sui)

Move é uma linguagem específica para blockchain, enquanto Rust é de **propósito geral** — isso significa que:

- Mais desenvolvedores já conhecem Rust
- Bibliotecas e ferramentas maduras (cargo, crates.io)
- Habilidades transferíveis para outros projetos

## O ecossistema Solana com Rust

Na prática, programas Solana em Rust usam o framework **Anchor** (a partir do nível intermediário):

\`\`\`rust
use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod meu_programa {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Programa inicializado!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
\`\`\`

## Conclusão

Rust oferece a combinação ideal para blockchain: **segurança + performance + sem GC**. Aprender Rust é um investimento que vai além do Solana — é uma das linguagens mais amadas do mundo por 8 anos consecutivos no Stack Overflow Survey.`,
          exercise: {
            question:
              "Qual é a principal vantagem de Rust não ter garbage collector para programas on-chain?",
            options: [
              "O código fica menor",
              "Não precisa de compilação",
              "Execução determinística sem pausas imprevisíveis",
              "Permite usar ponteiros nulos para otimização",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "rs-l2",
          title: "Variáveis e tipos",
          slug: "variaveis-tipos",
          type: "content",
          durationMinutes: 25,
          xpReward: 35,
          content: `# Variáveis e Tipos em Rust

Vamos aprender os fundamentos de variáveis e tipos em Rust, que formam a base para todo programa Solana.

## Declarando variáveis

Em Rust, variáveis são **imutáveis por padrão**:

\`\`\`rust
let x = 5;      // imutável
// x = 10;      // ERRO! não pode reatribuir

let mut y = 5;  // mutável
y = 10;         // OK
\`\`\`

Essa decisão de design encoraja imutabilidade, reduzindo bugs — especialmente importante em smart contracts.

## Tipos numéricos

Rust possui tipos inteiros com tamanho explícito:

\`\`\`rust
// Inteiros com sinal (signed)
let a: i8 = -128;       // -128 a 127
let b: i16 = -32768;    // -32768 a 32767
let c: i32 = 42;        // padrão para inteiros
let d: i64 = 1_000_000; // underscores para legibilidade

// Inteiros sem sinal (unsigned) — muito usados no Solana!
let e: u8 = 255;
let f: u32 = 100_000;
let g: u64 = 1_000_000_000; // lamports são u64!
let h: u128 = 340_282_366_920_938_463_463;

// Ponto flutuante
let pi: f64 = 3.14159;
let taxa: f32 = 0.01;
\`\`\`

> **No Solana**: saldos usam \`u64\` (lamports), timestamps usam \`i64\`, e cálculos de precisão alta usam \`u128\`.

## Strings

Rust tem dois tipos principais de strings:

\`\`\`rust
// String — alocada no heap, mutável
let mut nome = String::from("Solana");
nome.push_str(" é incrível!");

// &str — referência a string (string slice), imutável
let saudacao: &str = "Olá, mundo!";

// Conversão
let s: String = saudacao.to_string();
let slice: &str = &s;
\`\`\`

## Inferência de tipos

O compilador Rust geralmente infere o tipo:

\`\`\`rust
let x = 42;           // infere i32
let y = 3.14;         // infere f64
let nome = "Solana";  // infere &str
let ativo = true;     // infere bool
\`\`\`

## Shadowing

Rust permite **redeclarar** uma variável com o mesmo nome:

\`\`\`rust
let x = 5;
let x = x + 1;    // shadowing: x agora é 6
let x = x * 2;    // x agora é 12

// Shadowing permite trocar o tipo!
let spaces = "   ";        // &str
let spaces = spaces.len(); // usize — mesmo nome, tipo diferente
\`\`\`

## Constantes

Constantes são **sempre imutáveis** e exigem tipo explícito:

\`\`\`rust
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
const MAX_ACCOUNTS: usize = 32;
const PROGRAM_NAME: &str = "meu_programa";
\`\`\`

Diferenças de \`let\`:

- Devem ter tipo explícito
- Devem ser inicializadas com valor constante (sem chamadas de função)
- Convenção: SCREAMING_SNAKE_CASE
- Escopo global ou local

## Tuplas e Arrays

\`\`\`rust
// Tupla — tipos heterogêneos
let info: (u64, &str, bool) = (1_000_000, "SOL", true);
let saldo = info.0;  // 1_000_000

// Array — tamanho fixo, tipo homogêneo
let seeds: [u8; 4] = [1, 2, 3, 4];
let zeros = [0u8; 32]; // 32 bytes zerados — comum em Solana
\`\`\``,
          exercise: {
            question:
              "Qual tipo numérico é usado para representar saldos em lamports no Solana?",
            options: ["i32", "f64", "u64", "u8"],
            correctIndex: 2,
          },
        },
      ],
    },
    {
      id: "m5-2",
      title: "Ownership e Estruturas",
      lessons: [
        {
          id: "rs-l3",
          title: "Ownership e borrowing",
          slug: "ownership-borrowing",
          type: "content",
          durationMinutes: 30,
          xpReward: 45,
          content: `# Ownership e Borrowing

O sistema de **ownership** é o conceito mais único de Rust. Ele garante segurança de memória sem garbage collector — e entendê-lo é essencial para programas Solana.

## As três regras de ownership

1. Cada valor em Rust tem **um único dono** (owner)
2. Só pode haver **um dono por vez**
3. Quando o dono sai do escopo, o valor é **descartado** (dropped)

\`\`\`rust
{
    let s = String::from("hello"); // s é o dono de "hello"
    // s é válido aqui
} // s sai do escopo — memória é liberada automaticamente
\`\`\`

## Move semantics

Quando você atribui um valor a outra variável, o ownership é **transferido** (moved):

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1;  // s1 foi MOVIDO para s2

// println!("{}", s1); // ERRO! s1 não é mais válido
println!("{}", s2);    // OK
\`\`\`

Isso previne **double-free** — um bug clássico em C/C++.

## Referências (borrowing)

Para usar um valor sem transferir ownership, use **referências**:

\`\`\`rust
fn calcular_tamanho(s: &String) -> usize {
    s.len()
    // s é apenas uma referência — não é descartado aqui
}

let s1 = String::from("hello");
let tamanho = calcular_tamanho(&s1); // empresta s1
println!("{} tem {} bytes", s1, tamanho); // s1 ainda é válido!
\`\`\`

### Referências imutáveis (\`&T\`)

Você pode ter **múltiplas referências imutáveis** simultaneamente:

\`\`\`rust
let s = String::from("Solana");
let r1 = &s;
let r2 = &s;
println!("{} e {}", r1, r2); // OK — múltiplas refs imutáveis
\`\`\`

### Referências mutáveis (\`&mut T\`)

Apenas **uma referência mutável** por vez:

\`\`\`rust
let mut s = String::from("hello");
let r1 = &mut s;
// let r2 = &mut s; // ERRO! não pode ter duas &mut ao mesmo tempo
r1.push_str(" world");
println!("{}", r1);
\`\`\`

**Regra fundamental**: referências imutáveis OU uma referência mutável — nunca ambas.

## Clone e Copy

### Clone — cópia explícita (heap)

\`\`\`rust
let s1 = String::from("hello");
let s2 = s1.clone(); // cópia profunda
println!("{} e {}", s1, s2); // ambos válidos
\`\`\`

### Copy — cópia implícita (stack)

Tipos simples implementam \`Copy\` e são copiados automaticamente:

\`\`\`rust
let x: u64 = 42;
let y = x;  // copia, não move
println!("{} e {}", x, y); // ambos válidos

// Tipos que implementam Copy:
// i8, i16, i32, i64, u8, u16, u32, u64
// f32, f64, bool, char
// Tuplas de tipos Copy
\`\`\`

## Lifetimes (introdução)

Lifetimes garantem que referências não vivam mais que o dado ao qual se referem:

\`\`\`rust
fn maior<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if s1.len() > s2.len() { s1 } else { s2 }
}
\`\`\`

O \`'a\` diz ao compilador: "a referência retornada vive pelo menos tanto quanto s1 e s2".

## Por que isso importa para Solana?

No Solana, contas são passadas como referências (\`&AccountInfo\`). Entender borrowing é essencial para:

- Ler dados de contas (\`&account.data.borrow()\`)
- Modificar dados (\`&mut account.data.borrow_mut()\`)
- Evitar erros de "already borrowed" em CPIs`,
          exercise: {
            question:
              "O que acontece quando você atribui uma String a outra variável em Rust?",
            options: [
              "O valor é copiado automaticamente",
              "O ownership é transferido (move) e a variável original se torna inválida",
              "Ambas as variáveis apontam para o mesmo dado",
              "O compilador cria uma referência automaticamente",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "rs-l4",
          title: "Structs e enums",
          slug: "structs-enums",
          type: "content",
          durationMinutes: 25,
          xpReward: 40,
          content: `# Structs e Enums

Structs e enums são os tipos compostos fundamentais em Rust. No Solana, eles são usados extensivamente para definir **contas**, **instruções** e **erros**.

## Structs

Structs agrupam dados relacionados:

\`\`\`rust
// Definição
struct ContaSolana {
    pubkey: String,
    saldo: u64,
    executavel: bool,
}

// Instanciação
let conta = ContaSolana {
    pubkey: String::from("7nHfER..."),
    saldo: 1_000_000_000,
    executavel: false,
};

// Acesso
println!("Saldo: {} lamports", conta.saldo);
\`\`\`

### Blocos impl

Métodos e funções associadas são definidos em blocos \`impl\`:

\`\`\`rust
impl ContaSolana {
    // Função associada (construtor) — chamada com ::
    fn new(pubkey: String, saldo: u64) -> Self {
        Self {
            pubkey,
            saldo,
            executavel: false,
        }
    }

    // Método — recebe &self
    fn saldo_em_sol(&self) -> f64 {
        self.saldo as f64 / 1_000_000_000.0
    }

    // Método mutável — recebe &mut self
    fn depositar(&mut self, lamports: u64) {
        self.saldo += lamports;
    }
}

let mut conta = ContaSolana::new("7nHfER...".into(), 0);
conta.depositar(2_000_000_000);
println!("Saldo: {} SOL", conta.saldo_em_sol()); // 2.0
\`\`\`

### Structs no Anchor

No Solana com Anchor, structs definem o layout das contas:

\`\`\`rust
#[account]
pub struct UserProfile {
    pub authority: Pubkey,  // 32 bytes
    pub xp: u64,           // 8 bytes
    pub level: u8,         // 1 byte
    pub name: String,      // 4 + len bytes
}
\`\`\`

## Enums

Enums representam um valor que pode ser **uma de várias variantes**:

\`\`\`rust
enum Dificuldade {
    Iniciante,
    Intermediario,
    Avancado,
}

let nivel = Dificuldade::Intermediario;
\`\`\`

### Enums com dados

Variantes podem carregar dados:

\`\`\`rust
enum Instrucao {
    Transferir { destino: String, lamports: u64 },
    CriarConta(u64), // espaço em bytes
    FecharConta,
}

let ix = Instrucao::Transferir {
    destino: "9aE4...".into(),
    lamports: 500_000_000,
};
\`\`\`

## Option<T>

\`Option\` é um enum nativo para valores opcionais (substitui \`null\`):

\`\`\`rust
enum Option<T> {
    Some(T),
    None,
}

let freeze_authority: Option<Pubkey> = None;
let mint_authority: Option<Pubkey> = Some(my_pubkey);

// Acessando
if let Some(auth) = mint_authority {
    println!("Authority: {}", auth);
}
\`\`\`

## Result<T, E>

\`Result\` é o enum padrão para tratamento de erros:

\`\`\`rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}

fn dividir(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Divisão por zero!"))
    } else {
        Ok(a / b)
    }
}

match dividir(10.0, 3.0) {
    Ok(resultado) => println!("Resultado: {}", resultado),
    Err(erro) => println!("Erro: {}", erro),
}
\`\`\`

No Solana, **todas as funções de instrução retornam \`Result<()>\`**:

\`\`\`rust
pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
    // lógica...
    Ok(())
}
\`\`\``,
          exercise: {
            question:
              "Qual tipo Rust substitui o conceito de null encontrado em outras linguagens?",
            options: ["Result<T, E>", "Option<T>", "Null<T>", "Maybe<T>"],
            correctIndex: 1,
          },
        },
        {
          id: "rs-l5",
          title: "Pattern matching",
          slug: "pattern-matching",
          type: "content",
          durationMinutes: 25,
          xpReward: 40,
          content: `# Pattern Matching

Pattern matching é uma das funcionalidades mais poderosas de Rust. Ele permite desestruturar e comparar valores de forma expressiva e segura.

## match

A expressão \`match\` compara um valor contra vários **patterns**:

\`\`\`rust
let nivel: u8 = 5;

let titulo = match nivel {
    0..=2 => "Iniciante",
    3..=5 => "Intermediário",
    6..=9 => "Avançado",
    10 => "Mestre",
    _ => "Desconhecido", // _ captura todo o resto
};

println!("Nível {}: {}", nivel, titulo);
\`\`\`

### Match com enums

\`\`\`rust
enum StatusTransacao {
    Pendente,
    Confirmada(u64),  // slot number
    Falhou(String),   // mensagem de erro
}

let status = StatusTransacao::Confirmada(285_000_000);

match status {
    StatusTransacao::Pendente => println!("Aguardando..."),
    StatusTransacao::Confirmada(slot) => {
        println!("Confirmada no slot {}", slot);
    }
    StatusTransacao::Falhou(msg) => {
        println!("Falhou: {}", msg);
    }
}
\`\`\`

> **Importante**: \`match\` em Rust é **exaustivo** — você deve cobrir todos os casos possíveis ou usar \`_\` como fallback.

### Match com Option e Result

\`\`\`rust
let saldo: Option<u64> = Some(1_000_000_000);

match saldo {
    Some(lamports) if lamports > 0 => {
        println!("Saldo: {} SOL", lamports as f64 / 1e9);
    }
    Some(_) => println!("Saldo zero"),
    None => println!("Conta não encontrada"),
}
\`\`\`

## if let

Para quando você só se importa com **um pattern**:

\`\`\`rust
let authority: Option<String> = Some("7nHfER...".into());

// Em vez de match completo:
if let Some(auth) = authority {
    println!("Authority: {}", auth);
} else {
    println!("Sem authority");
}
\`\`\`

## while let

Loop que continua enquanto o pattern corresponder:

\`\`\`rust
let mut stack: Vec<u64> = vec![1, 2, 3, 4, 5];

while let Some(valor) = stack.pop() {
    println!("Processando: {}", valor);
}
// Imprime: 5, 4, 3, 2, 1
\`\`\`

## Destructuring

Desestruturar structs e tuplas:

\`\`\`rust
struct TransferInfo {
    de: String,
    para: String,
    lamports: u64,
}

let tx = TransferInfo {
    de: "Alice".into(),
    para: "Bob".into(),
    lamports: 500_000_000,
};

// Destructuring na declaração
let TransferInfo { de, para, lamports } = tx;
println!("{} enviou {} lamports para {}", de, lamports, para);

// Destructuring de tuplas
let (x, y, z) = (1, 2, 3);
\`\`\`

## Loops e Iteradores

\`\`\`rust
// for com range
for i in 0..10 {
    println!("Iteração {}", i);
}

// Iteradores com closures
let numeros = vec![1, 2, 3, 4, 5];

let dobrados: Vec<u64> = numeros
    .iter()
    .map(|n| n * 2)
    .collect();
// [2, 4, 6, 8, 10]

let soma: u64 = numeros.iter().sum();
// 15

let pares: Vec<&u64> = numeros
    .iter()
    .filter(|n| *n % 2 == 0)
    .collect();
// [2, 4]
\`\`\`

Iteradores são **lazy** — não executam até serem consumidos (por \`collect\`, \`sum\`, \`for_each\`, etc).`,
          exercise: {
            question:
              "O que acontece se um match em Rust não cobrir todos os casos possíveis?",
            options: [
              "Retorna None automaticamente",
              "O compilador emite um erro exigindo que todos os casos sejam cobertos",
              "Executa o primeiro braço por padrão",
              "Lança uma exceção em runtime",
            ],
            correctIndex: 1,
          },
        },
      ],
    },
    {
      id: "m5-3",
      title: "Avançado",
      lessons: [
        {
          id: "rs-l6",
          title: "Traits e generics",
          slug: "traits-generics",
          type: "content",
          durationMinutes: 25,
          xpReward: 40,
          content: `# Traits e Generics

Traits definem **comportamentos compartilhados** entre tipos. Generics permitem escrever código que funciona com **múltiplos tipos**. Juntos, eles são a base da abstração em Rust.

## Definindo uma trait

\`\`\`rust
trait Descritivel {
    fn descricao(&self) -> String;

    // Método com implementação padrão
    fn resumo(&self) -> String {
        format!("(Veja mais: {})", self.descricao())
    }
}
\`\`\`

## Implementando traits

\`\`\`rust
struct Curso {
    titulo: String,
    xp: u64,
}

impl Descritivel for Curso {
    fn descricao(&self) -> String {
        format!("{} ({} XP)", self.titulo, self.xp)
    }
    // resumo() usa a implementação padrão
}

let curso = Curso {
    titulo: "Rust para Solana".into(),
    xp: 280,
};
println!("{}", curso.descricao()); // "Rust para Solana (280 XP)"
println!("{}", curso.resumo());    // "(Veja mais: Rust para Solana (280 XP))"
\`\`\`

## Traits comuns da standard library

\`\`\`rust
use std::fmt;

// Display — como o valor aparece com println!("{}")
impl fmt::Display for Curso {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Curso: {} | {} XP", self.titulo, self.xp)
    }
}

// Debug — formato para debugging com {:?}
#[derive(Debug)]
struct Config {
    rpc_url: String,
    commitment: String,
}

let cfg = Config {
    rpc_url: "https://api.devnet.solana.com".into(),
    commitment: "confirmed".into(),
};
println!("{:?}", cfg);
// Config { rpc_url: "https://api.devnet.solana.com", commitment: "confirmed" }
\`\`\`

### Derive macros

Derive macros implementam traits automaticamente:

\`\`\`rust
#[derive(Debug, Clone, PartialEq)]
struct Token {
    symbol: String,
    decimals: u8,
    supply: u64,
}
\`\`\`

No Anchor, derive macros são essenciais:

\`\`\`rust
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct VaultState {
    pub authority: Pubkey,
    pub total_deposited: u64,
}
\`\`\`

## Generics

Generics permitem parametrizar tipos:

\`\`\`rust
// Função genérica
fn maior<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

let x = maior(10, 20);       // T = i32
let y = maior(3.14, 2.71);   // T = f64
\`\`\`

### Struct genérica

\`\`\`rust
struct Resultado<T> {
    valor: T,
    slot: u64,
    timestamp: i64,
}

let saldo = Resultado {
    valor: 1_500_000_000u64,
    slot: 285_000_000,
    timestamp: 1700000000,
};

let nome = Resultado {
    valor: String::from("Solana Academy"),
    slot: 285_000_000,
    timestamp: 1700000000,
};
\`\`\`

## Trait bounds

Restringem quais tipos podem ser usados com generics:

\`\`\`rust
// Sintaxe com :
fn imprimir<T: fmt::Display>(valor: T) {
    println!("Valor: {}", valor);
}

// Sintaxe com where (mais legível com múltiplos bounds)
fn processar<T>(item: T)
where
    T: fmt::Display + Clone + PartialOrd,
{
    let copia = item.clone();
    println!("Original: {}, Cópia: {}", item, copia);
}
\`\`\`

## Traits como parâmetros

\`\`\`rust
// Recebe qualquer tipo que implemente Descritivel
fn mostrar(item: &impl Descritivel) {
    println!("{}", item.descricao());
}

// Equivalente com trait bound
fn mostrar_v2<T: Descritivel>(item: &T) {
    println!("{}", item.descricao());
}
\`\`\`

Traits e generics são a base do **Anchor framework**: macros como \`#[derive(Accounts)]\` geram implementações de traits que fazem validação automática de contas.`,
          exercise: {
            question:
              "Qual macro derive é usada para gerar automaticamente uma representação de debug para uma struct?",
            options: [
              "#[derive(Display)]",
              "#[derive(Debug)]",
              "#[derive(ToString)]",
              "#[derive(Print)]",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "rs-l7",
          title: "Tratamento de erros",
          slug: "tratamento-erros",
          type: "challenge",
          durationMinutes: 25,
          xpReward: 50,
          content: `# Tratamento de Erros em Rust

Rust não possui exceções. Em vez disso, usa o tipo **Result<T, E>** para erros recuperáveis e \`panic!\` para erros irrecuperáveis. Essa abordagem é fundamental para programas Solana seguros.

## Result<T, E>

\`\`\`rust
use std::num::ParseIntError;

fn parse_lamports(input: &str) -> Result<u64, ParseIntError> {
    let lamports: u64 = input.parse()?;  // ? propaga o erro
    Ok(lamports)
}

match parse_lamports("1000000000") {
    Ok(lamports) => println!("Lamports: {}", lamports),
    Err(e) => println!("Erro ao parsear: {}", e),
}
\`\`\`

## O operador ?

O operador \`?\` é **açúcar sintático** para propagar erros:

\`\`\`rust
// Com ?
fn processar() -> Result<u64, String> {
    let valor = obter_saldo()?;  // retorna Err se falhar
    let resultado = calcular(valor)?;
    Ok(resultado)
}

// Equivalente sem ?
fn processar_verbose() -> Result<u64, String> {
    let valor = match obter_saldo() {
        Ok(v) => v,
        Err(e) => return Err(e),
    };
    let resultado = match calcular(valor) {
        Ok(r) => r,
        Err(e) => return Err(e),
    };
    Ok(resultado)
}
\`\`\`

## Erros customizados

Para programas complexos, defina seus próprios tipos de erro:

\`\`\`rust
use std::fmt;

#[derive(Debug)]
enum ProgramaErro {
    SaldoInsuficiente { necessario: u64, disponivel: u64 },
    ContaNaoEncontrada(String),
    NaoAutorizado,
    Overflow,
}

impl fmt::Display for ProgramaErro {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Self::SaldoInsuficiente { necessario, disponivel } => {
                write!(f, "Saldo insuficiente: necessário {} mas tem {}", necessario, disponivel)
            }
            Self::ContaNaoEncontrada(pk) => write!(f, "Conta não encontrada: {}", pk),
            Self::NaoAutorizado => write!(f, "Não autorizado"),
            Self::Overflow => write!(f, "Overflow aritmético"),
        }
    }
}

impl std::error::Error for ProgramaErro {}
\`\`\`

## thiserror (simplificando)

A crate \`thiserror\` gera as implementações de Display e Error automaticamente:

\`\`\`rust
use thiserror::Error;

#[derive(Error, Debug)]
enum ProgramaErro {
    #[error("Saldo insuficiente: necessário {necessario} mas tem {disponivel}")]
    SaldoInsuficiente { necessario: u64, disponivel: u64 },

    #[error("Conta não encontrada: {0}")]
    ContaNaoEncontrada(String),

    #[error("Não autorizado")]
    NaoAutorizado,

    #[error("Overflow aritmético")]
    Overflow,
}
\`\`\`

## Erros no Anchor

No Anchor, erros são definidos com a macro \`#[error_code]\`:

\`\`\`rust
#[error_code]
pub enum ErrorCode {
    #[msg("Saldo insuficiente para esta operação")]
    SaldoInsuficiente,
    #[msg("Não autorizado a executar esta ação")]
    NaoAutorizado,
    #[msg("Overflow no cálculo")]
    OverflowMatematico,
}

// Uso
pub fn sacar(ctx: Context<Sacar>, lamports: u64) -> Result<()> {
    require!(
        ctx.accounts.vault.saldo >= lamports,
        ErrorCode::SaldoInsuficiente
    );
    Ok(())
}
\`\`\`

## Propagação de erros em cadeia

\`\`\`rust
fn transferir(de: &str, para: &str, valor: &str) -> Result<String, ProgramaErro> {
    let lamports: u64 = valor
        .parse()
        .map_err(|_| ProgramaErro::Overflow)?;

    let saldo = obter_saldo(de)
        .map_err(|_| ProgramaErro::ContaNaoEncontrada(de.to_string()))?;

    if saldo < lamports {
        return Err(ProgramaErro::SaldoInsuficiente {
            necessario: lamports,
            disponivel: saldo,
        });
    }

    Ok(format!("Transferido {} de {} para {}", lamports, de, para))
}
\`\`\`

O operador \`?\` combinado com \`.map_err()\` permite converter entre tipos de erro de forma elegante.`,
          exercise: {
            question: "O que o operador ? faz quando encontra um Err?",
            options: [
              "Converte o Err em None",
              "Causa um panic! imediato",
              "Retorna o Err da função atual (propaga o erro)",
              "Ignora o erro e continua a execução",
            ],
            correctIndex: 2,
          },
          challenge: {
            prompt:
              "Implemente uma função validar_transferencia em Rust que verifica saldo, autoridade e limites, retornando erros customizados com thiserror.",
            starterCode: `use thiserror::Error;

#[derive(Error, Debug)]
enum TransferError {
    // TODO: Defina 3 variantes de erro:
    // 1. SaldoInsuficiente com campos: necessario (u64) e disponivel (u64)
    // 2. NaoAutorizado (sem campos)
    // 3. LimiteExcedido com campo: limite (u64)
}

struct ContaOrigem {
    saldo: u64,
    autoridade: String,
}

fn validar_transferencia(
    conta: &ContaOrigem,
    remetente: &str,
    valor: u64,
    limite_max: u64,
) -> Result<(), TransferError> {
    // TODO: Verificar se remetente == conta.autoridade
    // Caso contrário, retornar TransferError::NaoAutorizado

    // TODO: Verificar se valor <= limite_max
    // Caso contrário, retornar TransferError::LimiteExcedido

    // TODO: Verificar se conta.saldo >= valor
    // Caso contrário, retornar TransferError::SaldoInsuficiente

    Ok(())
}

fn main() {
    let conta = ContaOrigem {
        saldo: 1_000_000_000,
        autoridade: "alice".to_string(),
    };

    match validar_transferencia(&conta, "alice", 500_000_000, 2_000_000_000) {
        Ok(()) => println!("Transferência válida!"),
        Err(e) => println!("Erro: {}", e),
    }
}`,
            language: "rust",
            testCases: [
              {
                input:
                  'validar_transferencia(&conta, "alice", 500_000_000, 2_000_000_000)',
                expected: "Ok(())",
              },
              {
                input:
                  'validar_transferencia(&conta, "bob", 500_000_000, 2_000_000_000)',
                expected: "Err(TransferError::NaoAutorizado)",
              },
              {
                input:
                  'validar_transferencia(&conta, "alice", 5_000_000_000, 2_000_000_000)',
                expected:
                  "Err(TransferError::LimiteExcedido { limite: 2_000_000_000 })",
              },
              {
                input:
                  'validar_transferencia(&conta, "alice", 2_000_000_000, 5_000_000_000)',
                expected:
                  "Err(TransferError::SaldoInsuficiente { necessario: 2_000_000_000, disponivel: 1_000_000_000 })",
              },
            ],
          },
        },
      ],
    },
  ],
};

export const course6: Course = {
  id: "6",
  slug: "pdas-e-contas",
  title: "PDAs e contas no Solana",
  description:
    "Program Derived Addresses e o modelo de contas em profundidade.",
  longDescription:
    "Aprenda como contas e PDAs funcionam, como escolher seeds, criar contas com PDAs, usar PDAs como signers e simular hashmaps on-chain.",
  difficulty: "intermediate",
  duration: "medium",
  totalDurationMinutes: 210,
  xpTotal: 460,
  thumbnail: "/courses/pdas-e-contas.png",
  instructor: {
    name: "Kauê",
    avatar: "/instructors/kaue.png",
    role: "Instrutor",
  },
  instructorSlug: "kaue",
  track: "Solana Fundamentals",
  modules: [
    {
      id: "m6-1",
      title: "Fundamentos de Contas",
      lessons: [
        {
          id: "pda-l1",
          title: "O modelo de contas revisitado",
          slug: "modelo-contas-revisitado",
          type: "content",
          durationMinutes: 25,
          xpReward: 50,
          content: `# O Modelo de Contas Revisitado

No Solana, **tudo é uma conta**. Programas, tokens, NFTs, dados de usuário — tudo é armazenado em contas. Entender esse modelo em profundidade é essencial para trabalhar com PDAs.

## Estrutura de uma conta

Toda conta no Solana possui os seguintes campos:

\`\`\`
┌─────────────────────────────────────────┐
│  Account                                │
├─────────────────────────────────────────┤
│  lamports: u64        (saldo em SOL)    │
│  data: Vec<u8>        (dados binários)  │
│  owner: Pubkey        (programa dono)   │
│  executable: bool     (é um programa?)  │
│  rent_epoch: u64      (época de rent)   │
└─────────────────────────────────────────┘
\`\`\`

### Detalhando cada campo

- **lamports**: saldo da conta em lamports (1 SOL = 10^9 lamports). Toda conta precisa de um saldo mínimo para existir.
- **data**: array de bytes que armazena dados arbitrários. Para wallets, é vazio. Para programas, contém o bytecode. Para contas de dados, contém dados serializados.
- **owner**: a Pubkey do **programa** que controla esta conta. Somente o owner pode modificar o campo \`data\` e debitar lamports.
- **executable**: flag que indica se a conta é um programa executável.
- **rent_epoch**: controle interno de rent (geralmente ignorado — a maioria das contas é rent-exempt).

## Owner vs Authority

Um conceito que confunde muitos iniciantes:

\`\`\`
Owner (campo da conta)  ≠  Authority (conceito lógico)
\`\`\`

- **Owner**: o programa que controla a conta (campo do runtime). Ex: System Program, Token Program
- **Authority**: a chave pública autorizada a executar operações — definida nos dados da conta ou nas instruções

\`\`\`
Carteira SOL:
  owner = System Program (11111111111111111111111111111111)
  authority = sua chave pública (você controla)

Token Account:
  owner = Token Program (TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA)
  authority = sua chave pública (campo nos dados)
\`\`\`

## Rent e Rent Exemption

Contas no Solana precisam pagar **rent** para ocupar espaço na blockchain. Na prática, todas as contas devem ser **rent-exempt** (isentas), depositando um saldo mínimo:

\`\`\`bash
# Verificar rent mínimo para X bytes
solana rent 100
# Resultado: Rent per byte-year: 0.00000348 SOL
# Minimum balance for rent exemption: 0.00089088 SOL
\`\`\`

Fórmula aproximada:

\`\`\`
rent_exempt_minimum = (128 + data_length) * 6.96e-6 SOL
\`\`\`

## Limitações importantes

- **Tamanho máximo**: 10 MB por conta (mas a maioria usa < 10 KB)
- **Imutável após execução**: contas de programa são imutáveis após deploy (exceto via upgrade authority)
- **Apenas o owner modifica data**: nenhum outro programa pode alterar os bytes de data
- **Qualquer um pode creditar**: qualquer programa pode enviar lamports para uma conta
- **Apenas o owner debita**: somente o programa owner pode retirar lamports

## Visualizando via CLI

\`\`\`bash
# Ver detalhes de qualquer conta
solana account <ENDEREÇO>

# Saída:
# Public Key: 7nHfER...
# Balance: 1.5 SOL
# Owner: 11111111111111111111111111111111
# Executable: false
# Rent Epoch: 361
\`\`\`

Esse entendimento profundo do modelo de contas é o alicerce para trabalhar com PDAs, que veremos a seguir.`,
          exercise: {
            question:
              "Quem pode modificar o campo data de uma conta no Solana?",
            options: [
              "Qualquer programa pode modificar qualquer conta",
              "Apenas o programa owner da conta pode modificar seus dados",
              "Apenas a authority definida na transação",
              "O validador que processou a transação",
            ],
            correctIndex: 1,
          },
        },
        {
          id: "pda-l2",
          title: "Program Derived Addresses",
          slug: "program-derived-addresses",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Program Derived Addresses (PDAs)

PDAs são endereços **derivados deterministicamente** a partir de um programa e um conjunto de seeds. São um dos conceitos mais importantes do Solana.

## O que é uma PDA?

Uma PDA é um endereço que:

1. É derivado de um **program ID** + **seeds** + **bump**
2. **Não possui chave privada** — ninguém pode assinar diretamente
3. É **determinístico** — mesmas seeds + programa = mesmo endereço
4. Fica **fora da curva Ed25519** (off-curve)

\`\`\`
PDA = hash(seeds, program_id, bump)
     onde bump garante que o resultado está fora da curva
\`\`\`

## Por que PDAs existem?

Sem PDAs, programas Solana não poderiam "possuir" contas de forma determinística. PDAs resolvem:

- **Endereços determinísticos**: dado um programa e seeds, o endereço é sempre o mesmo
- **Autoridade programática**: o programa pode "assinar" via PDA sem chave privada
- **Lookup fácil**: qualquer um pode derivar o endereço conhecendo as seeds

## findProgramAddress

A função principal para encontrar uma PDA:

\`\`\`typescript
import { PublicKey } from '@solana/web3.js';

const [pda, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("user_profile"),           // seed string
    userPubkey.toBuffer(),                 // seed pubkey
  ],
  programId                                // programa
);

console.log("PDA:", pda.toBase58());
console.log("Bump:", bump);
\`\`\`

Em Rust/Anchor:

\`\`\`rust
let (pda, bump) = Pubkey::find_program_address(
    &[
        b"user_profile",
        user.key().as_ref(),
    ],
    &program_id,
);
\`\`\`

## Seeds (sementes)

Seeds são bytes arbitrários usados como entrada para derivar a PDA:

\`\`\`typescript
// String como seed
Buffer.from("vault")

// Pubkey como seed
ownerPubkey.toBuffer()

// Número como seed
new BN(42).toArrayLike(Buffer, 'le', 8) // u64 little-endian
\`\`\`

## O que é o bump?

O bump é um número de 0 a 255 que garante que o endereço derivado **não está na curva Ed25519**:

\`\`\`
Para bump = 255:
  hash(seeds + [255] + program_id) → na curva? → SIM → próximo
Para bump = 254:
  hash(seeds + [254] + program_id) → na curva? → NÃO → ENCONTRADO!
\`\`\`

O **canonical bump** é o primeiro bump encontrado (maior valor). \`findProgramAddress\` começa em 255 e decrementa até encontrar um endereço off-curve.

## Por que off-curve?

Se o endereço estivesse na curva Ed25519, **teoricamente existiria uma chave privada correspondente**. Isso seria um risco de segurança — alguém poderia assinar como se fosse o programa.

PDAs off-curve garantem que **apenas o programa pode assinar** via \`invoke_signed\`.

## Visualização

\`\`\`
┌─ Program ID ─────────────────────────┐
│ Fg6PaFpoGXkYsidMpWTK6W2BeZ7FE...    │
│                                       │
│  Seeds: ["vault", user_pubkey]        │
│  Bump: 254                            │
│           │                           │
│           ▼                           │
│  PDA: 8xKf9J3dq2Vn7aP...            │
│  (endereço determinístico)            │
└───────────────────────────────────────┘
\`\`\`

## Características-chave

- **Determinístico**: mesmas seeds = mesmo endereço, sempre
- **Sem chave privada**: impossível assinar diretamente
- **Único por programa**: o mesmo seed gera PDAs diferentes para programas diferentes
- **Eficiente para lookup**: derive o endereço no client sem consultar a blockchain`,
          exercise: {
            question:
              "Por que PDAs no Solana devem estar fora da curva Ed25519?",
            options: [
              "Para economizar espaço de armazenamento",
              "Para garantir que nenhuma chave privada corresponda ao endereço, apenas o programa pode assinar",
              "Para que a derivação seja mais rápida computacionalmente",
              "Para compatibilidade com outras blockchains",
            ],
            correctIndex: 1,
          },
        },
      ],
    },
    {
      id: "m6-2",
      title: "Trabalhando com PDAs",
      lessons: [
        {
          id: "pda-l3",
          title: "Seeds e determinismo",
          slug: "seeds-determinismo",
          type: "content",
          durationMinutes: 30,
          xpReward: 60,
          content: `# Seeds e Determinismo

Escolher as seeds corretas é uma das decisões de design mais importantes ao arquitetar um programa Solana. Seeds ruins levam a colisões, inflexibilidade e bugs difíceis de diagnosticar.

## Tipos de seeds

### String seeds

\`\`\`rust
// Prefixo fixo — identifica o TIPO de conta
#[account(
    seeds = [b"vault"],
    bump,
)]
pub vault: Account<'info, Vault>,
\`\`\`

### Pubkey seeds

\`\`\`rust
// Pubkey do usuário — cria uma conta POR usuário
#[account(
    seeds = [b"profile", user.key().as_ref()],
    bump,
)]
pub profile: Account<'info, UserProfile>,
\`\`\`

### Número seeds (u64, u8)

\`\`\`rust
// ID numérico — útil para listas/sequências
let id: u64 = 42;
#[account(
    seeds = [b"post", &id.to_le_bytes()],
    bump,
)]
pub post: Account<'info, BlogPost>,
\`\`\`

### Seeds combinadas

\`\`\`rust
// Combinação para máxima especificidade
#[account(
    seeds = [
        b"enrollment",
        course_id.as_ref(),
        student.key().as_ref(),
    ],
    bump,
)]
pub enrollment: Account<'info, Enrollment>,
\`\`\`

## Garantindo unicidade

O endereço PDA deve ser **único** para cada entidade que você quer representar. Considere:

\`\`\`
// RUIM — todos os vaults teriam o mesmo endereço!
seeds = [b"vault"]

// BOM — um vault por usuário
seeds = [b"vault", user.key().as_ref()]

// MELHOR — um vault por usuário por token
seeds = [b"vault", user.key().as_ref(), mint.key().as_ref()]
\`\`\`

## Canonical bump

O **canonical bump** é o maior bump (mais próximo de 255) que gera um endereço off-curve. É o valor retornado por \`findProgramAddress\`:

\`\`\`typescript
const [pda, canonicalBump] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), userPubkey.toBuffer()],
  programId
);
// canonicalBump pode ser, por exemplo, 253
\`\`\`

### Por que sempre usar o canonical bump?

\`\`\`
Bump 255: na curva (inválido)
Bump 254: na curva (inválido)
Bump 253: OFF-CURVE ← canonical bump ✓
Bump 252: off-curve (válido, mas não canonical)
Bump 251: off-curve (válido, mas não canonical)
...
\`\`\`

Se permitir bumps não-canônicos, o mesmo "conceito" pode ter **múltiplos endereços**. O Anchor resolve isso automaticamente com a constraint \`bump\`:

\`\`\`rust
#[account(
    seeds = [b"vault", user.key().as_ref()],
    bump, // Anchor valida o canonical bump automaticamente
)]
pub vault: Account<'info, Vault>,
\`\`\`

## Padrões de design para seeds

### 1. Conta singleton (uma por programa)

\`\`\`rust
seeds = [b"global_config"]
\`\`\`

### 2. Uma conta por usuário

\`\`\`rust
seeds = [b"profile", user.key().as_ref()]
\`\`\`

### 3. Relação N:M (muitos para muitos)

\`\`\`rust
// Matrícula: aluno X em curso Y
seeds = [b"enrollment", course_id.as_ref(), student.key().as_ref()]
\`\`\`

### 4. Lista sequencial

\`\`\`rust
// Post #42 do autor
seeds = [b"post", author.key().as_ref(), &post_id.to_le_bytes()]
\`\`\`

## Limitações

- **Tamanho máximo de seeds**: 32 bytes por seed individual, até 16 seeds
- **Strings variáveis**: cuidado ao usar strings como seeds — \`"abc"\` e \`"abc "\` geram PDAs diferentes
- **Case-sensitive**: \`"Vault"\` ≠ \`"vault"\`

Escolher seeds é como projetar chaves primárias em um banco de dados — pense na **unicidade** e na **acessibilidade** (quem precisa derivar este endereço?).`,
          exercise: {
            question:
              "Por que é importante sempre usar o canonical bump ao trabalhar com PDAs?",
            options: [
              "Porque bumps menores são mais eficientes computacionalmente",
              "Porque o canonical bump é sempre 255",
              "Para garantir que cada conceito tenha um único endereço PDA determinístico",
              "Porque o Solana runtime rejeita bumps não-canônicos",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "pda-l4",
          title: "Criando contas com PDAs",
          slug: "criando-contas-pdas",
          type: "content",
          durationMinutes: 30,
          xpReward: 70,
          content: `# Criando Contas com PDAs

Agora que entendemos o que são PDAs e como escolher seeds, vamos aprender a **criar contas** em endereços PDA usando o Anchor framework.

## A constraint init no Anchor

O Anchor simplifica drasticamente a criação de contas PDA com a constraint \`init\`:

\`\`\`rust
#[derive(Accounts)]
pub struct CriarPerfil<'info> {
    #[account(
        init,
        payer = usuario,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", usuario.key().as_ref()],
        bump,
    )]
    pub perfil: Account<'info, UserProfile>,

    #[account(mut)]
    pub usuario: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

### O que init faz por baixo:

1. Deriva o endereço PDA a partir das seeds
2. Calcula o rent-exempt mínimo
3. Faz uma **CPI** para o System Program criando a conta
4. Atribui o **owner** como o programa atual
5. Serializa o **discriminator** (8 bytes) nos dados

## Calculando o space

O campo \`space\` determina quantos bytes a conta vai ocupar. No Anchor:

\`\`\`rust
space = 8 + TamanhoDosDados
         │
         └── discriminator do Anchor (8 bytes, sempre obrigatório)
\`\`\`

### Tabela de tamanhos

| Tipo | Tamanho |
|---|---|
| bool | 1 byte |
| u8 / i8 | 1 byte |
| u16 / i16 | 2 bytes |
| u32 / i32 | 4 bytes |
| u64 / i64 | 8 bytes |
| u128 / i128 | 16 bytes |
| Pubkey | 32 bytes |
| String | 4 + comprimento |
| Vec<T> | 4 + (n * sizeof(T)) |
| Option<T> | 1 + sizeof(T) |

### Exemplo de cálculo

\`\`\`rust
#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,      // 32 bytes
    pub xp: u64,                // 8 bytes
    pub level: u8,              // 1 byte
    #[max_len(50)]
    pub name: String,           // 4 + 50 = 54 bytes
    pub created_at: i64,        // 8 bytes
}

// Total: 8 (discriminator) + 32 + 8 + 1 + 54 + 8 = 111 bytes
\`\`\`

Com \`InitSpace\`, o Anchor calcula automaticamente:

\`\`\`rust
space = 8 + UserProfile::INIT_SPACE
\`\`\`

## CPI para o System Program (sem Anchor)

Para entender o que acontece por baixo, veja a criação manual via CPI:

\`\`\`rust
use solana_program::{
    system_instruction,
    program::invoke_signed,
};

// Criar a instrução
let create_account_ix = system_instruction::create_account(
    payer.key,           // quem paga
    pda.key,             // endereço da nova conta
    rent_lamports,       // lamports para rent exemption
    space as u64,        // tamanho em bytes
    program_id,          // owner da nova conta
);

// Executar com as seeds da PDA (invoke_signed)
invoke_signed(
    &create_account_ix,
    &[payer.clone(), pda.clone(), system_program.clone()],
    &[&[
        b"profile",
        user_key.as_ref(),
        &[bump],
    ]],
)?;
\`\`\`

## Payer e rent

A conta que paga (\`payer\`) deve:

1. Ser um **signer** da transação
2. Ter SOL suficiente para cobrir o **rent-exempt minimum**
3. Ser marcada como \`mut\` (seu saldo será debitado)

\`\`\`rust
// Verificar rent no client
const space = 111;
const rentExempt = await connection.getMinimumBalanceForRentExemption(space);
console.log(\`Rent-exempt: \${rentExempt / LAMPORTS_PER_SOL} SOL\`);
\`\`\`

## Restrição init_if_needed

Para criar a conta apenas se ela ainda não existir:

\`\`\`rust
#[account(
    init_if_needed,
    payer = usuario,
    space = 8 + UserProfile::INIT_SPACE,
    seeds = [b"profile", usuario.key().as_ref()],
    bump,
)]
pub perfil: Account<'info, UserProfile>,
\`\`\`

> **Cuidado**: \`init_if_needed\` exige a feature flag \`init-if-needed\` no Cargo.toml e tem implicações de segurança (a conta pode ser reutilizada). Use com cuidado e sempre valide os dados existentes.`,
          exercise: {
            question:
              "Quantos bytes o discriminator do Anchor ocupa no início de cada conta?",
            options: ["4 bytes", "8 bytes", "16 bytes", "32 bytes"],
            correctIndex: 1,
          },
        },
        {
          id: "pda-l5",
          title: "PDAs como signers",
          slug: "pdas-como-signers",
          type: "content",
          durationMinutes: 30,
          xpReward: 70,
          content: `# PDAs como Signers

Uma das funcionalidades mais poderosas das PDAs é a capacidade de "assinar" transações em nome do programa. Isso permite que programas controlem contas e executem operações de forma autônoma.

## O conceito

PDAs não possuem chave privada, então não podem assinar no sentido criptográfico. Em vez disso, o runtime do Solana permite que um programa **prove** que uma PDA pertence a ele, usando as seeds:

\`\`\`
Assinatura normal: chave privada → assinatura Ed25519
Assinatura PDA:    programa + seeds + bump → prova de derivação
\`\`\`

## invoke_signed

A função \`invoke_signed\` permite que o programa faça uma CPI (Cross-Program Invocation) "assinando" como a PDA:

\`\`\`rust
use solana_program::program::invoke_signed;

// Transferir SOL de uma PDA para um usuário
let transfer_ix = system_instruction::transfer(
    vault_pda.key,    // de: a PDA
    recipient.key,    // para: o destinatário
    amount,           // quantidade em lamports
);

invoke_signed(
    &transfer_ix,
    &[vault_pda.clone(), recipient.clone(), system_program.clone()],
    &[&[
        b"vault",              // seed 1
        authority.key.as_ref(), // seed 2
        &[bump],               // bump
    ]],
)?;
\`\`\`

O runtime verifica:

1. Calcula \`hash(seeds + bump + program_id)\`
2. Compara com o endereço da PDA passada
3. Se coincidir, permite a operação como se a PDA tivesse "assinado"

## PDA como authority no Anchor

No Anchor, PDAs como signers são mais ergonômicas:

\`\`\`rust
#[derive(Accounts)]
pub struct Sacar<'info> {
    #[account(
        mut,
        seeds = [b"vault", authority.key().as_ref()],
        bump = vault.bump,
    )]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn sacar(ctx: Context<Sacar>, amount: u64) -> Result<()> {
    // Transferir lamports da vault PDA para a authority
    let vault = &ctx.accounts.vault;

    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.authority.try_borrow_mut_lamports()? += amount;

    Ok(())
}
\`\`\`

## CPI com PDA signer no Anchor

Para CPIs mais complexas (ex: transferir tokens):

\`\`\`rust
use anchor_spl::token::{self, Transfer, Token};

pub fn transferir_tokens(ctx: Context<TransferirTokens>, amount: u64) -> Result<()> {
    let authority_key = ctx.accounts.authority.key();
    let seeds = &[
        b"vault",
        authority_key.as_ref(),
        &[ctx.accounts.vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: ctx.accounts.vault_token.to_account_info(),
            to: ctx.accounts.user_token.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(), // PDA assina
        },
        signer_seeds,
    );

    token::transfer(cpi_ctx, amount)?;
    Ok(())
}
\`\`\`

## Padrão: Vault com PDA authority

Um padrão muito comum em DeFi:

\`\`\`
┌──────────┐    deposita    ┌──────────────┐
│  Usuário │ ──────────────→│  Vault PDA   │
│          │                │  (guarda SOL) │
│          │ ←──────────────│              │
└──────────┘    saca        └──────────────┘
                             PDA assina o
                             saque via
                             invoke_signed
\`\`\`

### Struct da vault armazenando o bump

\`\`\`rust
#[account]
pub struct Vault {
    pub authority: Pubkey,  // quem pode sacar
    pub bump: u8,           // bump para assinar
    pub total: u64,         // total depositado
}
\`\`\`

> **Dica importante**: sempre armazene o bump na conta para evitar recalculá-lo. Isso economiza compute units e simplifica o código.

## Segurança

- Sempre valide que a **authority** é quem deveria ser
- Armazene o bump na conta para eficiência e segurança
- Verifique que as seeds correspondem exatamente ao esperado
- Use constraints do Anchor (\`has_one\`, \`constraint\`) para validações automáticas`,
          exercise: {
            question:
              'Como um programa Solana "assina" uma transação usando uma PDA?',
            options: [
              "Usando a chave privada da PDA armazenada no programa",
              "Via invoke_signed, provando ao runtime que as seeds derivam a PDA corretamente",
              "Pedindo ao validador para assinar em nome do programa",
              "Usando um oráculo externo para gerar a assinatura",
            ],
            correctIndex: 1,
          },
        },
      ],
    },
    {
      id: "m6-3",
      title: "Padrões Avançados",
      lessons: [
        {
          id: "pda-l6",
          title: "Hashmaps on-chain",
          slug: "hashmaps-on-chain",
          type: "content",
          durationMinutes: 25,
          xpReward: 60,
          content: `# Hashmaps On-Chain

O Solana não possui nativamente uma estrutura de hashmap on-chain. Porém, usando PDAs de forma inteligente, podemos **simular** hashmaps com lookup O(1) — sem iteração!

## O conceito

Em um hashmap tradicional:

\`\`\`
map[chave] = valor
\`\`\`

Com PDAs no Solana:

\`\`\`
PDA(seeds=[prefixo, chave]) → conta com o valor
\`\`\`

A "chave" do hashmap é codificada nas **seeds**, e o "valor" é armazenado nos dados da conta PDA.

## Exemplo: Perfil de usuário

\`\`\`rust
// Hashmap conceitual: user_pubkey → UserProfile
// PDA: seeds = ["profile", user_pubkey]

#[account]
pub struct UserProfile {
    pub authority: Pubkey,
    pub xp: u64,
    pub level: u8,
    pub bump: u8,
}

#[derive(Accounts)]
pub struct GetProfile<'info> {
    #[account(
        seeds = [b"profile", user.key().as_ref()],
        bump = profile.bump,
    )]
    pub profile: Account<'info, UserProfile>,
    pub user: SystemAccount<'info>,
}
\`\`\`

Lookup no client:

\`\`\`typescript
// O(1) — sem iteração, sem busca em lista
const [profilePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("profile"), userPubkey.toBuffer()],
  programId
);

const profile = await program.account.userProfile.fetch(profilePda);
\`\`\`

## Exemplo: Mapeamento token → preço

\`\`\`rust
// Hashmap: mint_pubkey → PriceData
#[account]
pub struct PriceData {
    pub mint: Pubkey,        // 32 bytes
    pub price_usd: u64,     // 8 bytes (centavos)
    pub last_update: i64,   // 8 bytes
    pub bump: u8,            // 1 byte
}

// seeds = ["price", mint_pubkey]
\`\`\`

## Padrão: chave composta

Para relações N:M, use múltiplas chaves nas seeds:

\`\`\`rust
// Hashmap: (curso, aluno) → Enrollment
#[account]
pub struct Enrollment {
    pub course: Pubkey,
    pub student: Pubkey,
    pub progress: u16,    // bitmap de lições completadas
    pub enrolled_at: i64,
    pub bump: u8,
}

// seeds = ["enrollment", course_pubkey, student_pubkey]
\`\`\`

\`\`\`typescript
// Verificar se aluno está matriculado — O(1)
const [enrollmentPda] = PublicKey.findProgramAddressSync(
  [
    Buffer.from("enrollment"),
    coursePubkey.toBuffer(),
    studentPubkey.toBuffer(),
  ],
  programId
);

try {
  const enrollment = await program.account.enrollment.fetch(enrollmentPda);
  console.log("Matriculado! Progresso:", enrollment.progress);
} catch {
  console.log("Não matriculado");
}
\`\`\`

## Padrão: chave numérica (lista indexada)

\`\`\`rust
// Hashmap: (author, post_id) → BlogPost
#[account]
pub struct BlogPost {
    pub author: Pubkey,
    pub post_id: u64,
    pub title: String,
    pub content: String,
    pub bump: u8,
}

// seeds = ["post", author_pubkey, post_id_bytes]
\`\`\`

Para iterar sobre posts, mantenha um **contador** no perfil:

\`\`\`rust
#[account]
pub struct AuthorProfile {
    pub authority: Pubkey,
    pub post_count: u64,   // contador de posts
    pub bump: u8,
}

// No client, iterar:
for (let i = 0; i < author.postCount; i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("post"), authorPubkey.toBuffer(), new BN(i).toArrayLike(Buffer, 'le', 8)],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
}
\`\`\`

## Limitações e alternativas

- **Sem iteração nativa**: não é possível "listar todas as chaves" on-chain
- **Solução**: use \`getProgramAccounts\` no client (com filtros) ou indexadores como Helius DAS
- **Tamanho fixo**: o espaço da conta deve ser definido na criação — use \`realloc\` se necessário
- **Custo**: cada entrada é uma conta separada (rent-exempt), o que custa ~0.002 SOL por entrada típica`,
          exercise: {
            question: "Como PDAs simulam um hashmap on-chain no Solana?",
            options: [
              "Armazenando um HashMap do Rust diretamente nos dados da conta",
              "Usando uma conta especial do System Program para lookup",
              "Codificando a chave do hashmap nas seeds da PDA, tornando o endereço determinístico",
              "Usando um programa de indexação off-chain para simular a busca",
            ],
            correctIndex: 2,
          },
        },
        {
          id: "pda-l7",
          title: "Exercício prático: blog on-chain",
          slug: "blog-on-chain",
          type: "challenge",
          durationMinutes: 40,
          xpReward: 90,
          content: `# Exercício Prático: Blog On-Chain

Vamos construir um **blog on-chain** usando PDAs no Anchor! Cada post será uma conta PDA derivada do autor e de um ID sequencial. Também teremos operações de criar e atualizar posts.

## Arquitetura

\`\`\`
AuthorProfile PDA                BlogPost PDA
seeds: ["author", pubkey]       seeds: ["post", pubkey, id_bytes]
┌─────────────────────┐         ┌──────────────────────────┐
│ authority: Pubkey    │         │ author: Pubkey           │
│ post_count: u64      │         │ post_id: u64             │
│ bump: u8             │         │ title: String (max 50)   │
└─────────────────────┘         │ content: String (max 500)│
                                │ timestamp: i64           │
                                │ updated: bool            │
                                │ bump: u8                 │
                                └──────────────────────────┘
\`\`\`

## Instruções

### 1. initialize_author

Cria o perfil do autor com \`post_count = 0\`:

\`\`\`rust
pub fn initialize_author(ctx: Context<InitializeAuthor>) -> Result<()> {
    let author = &mut ctx.accounts.author_profile;
    author.authority = ctx.accounts.user.key();
    author.post_count = 0;
    author.bump = ctx.bumps.author_profile;
    Ok(())
}
\`\`\`

### 2. create_post

Cria um novo post e incrementa o \`post_count\`:

\`\`\`rust
pub fn create_post(
    ctx: Context<CreatePost>,
    title: String,
    content: String,
) -> Result<()> {
    require!(title.len() <= 50, BlogError::TituloMuitoLongo);
    require!(content.len() <= 500, BlogError::ConteudoMuitoLongo);

    let post = &mut ctx.accounts.blog_post;
    let author = &mut ctx.accounts.author_profile;

    post.author = ctx.accounts.user.key();
    post.post_id = author.post_count;
    post.title = title;
    post.content = content;
    post.timestamp = Clock::get()?.unix_timestamp;
    post.updated = false;
    post.bump = ctx.bumps.blog_post;

    author.post_count += 1;
    Ok(())
}
\`\`\`

### 3. update_post

Atualiza título e/ou conteúdo de um post existente:

\`\`\`rust
pub fn update_post(
    ctx: Context<UpdatePost>,
    new_title: String,
    new_content: String,
) -> Result<()> {
    let post = &mut ctx.accounts.blog_post;
    post.title = new_title;
    post.content = new_content;
    post.updated = true;
    Ok(())
}
\`\`\`

## Structs de contas

\`\`\`rust
#[derive(Accounts)]
pub struct CreatePost<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + BlogPost::INIT_SPACE,
        seeds = [
            b"post",
            user.key().as_ref(),
            &author_profile.post_count.to_le_bytes(),
        ],
        bump,
    )]
    pub blog_post: Account<'info, BlogPost>,

    #[account(
        mut,
        seeds = [b"author", user.key().as_ref()],
        bump = author_profile.bump,
        has_one = authority @ BlogError::NaoAutorizado,
    )]
    pub author_profile: Account<'info, AuthorProfile>,

    #[account(mut)]
    pub user: Signer<'info>,

    pub system_program: Program<'info, System>,
}
\`\`\`

## Calculando o space

\`\`\`
BlogPost:
  discriminator: 8
  author (Pubkey): 32
  post_id (u64): 8
  title (String, max 50): 4 + 50 = 54
  content (String, max 500): 4 + 500 = 504
  timestamp (i64): 8
  updated (bool): 1
  bump (u8): 1
  Total: 8 + 32 + 8 + 54 + 504 + 8 + 1 + 1 = 616 bytes
\`\`\`

## Lendo posts no client

\`\`\`typescript
// Listar todos os posts de um autor
for (let i = 0; i < authorProfile.postCount.toNumber(); i++) {
  const [postPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("post"),
      authorPubkey.toBuffer(),
      new BN(i).toArrayLike(Buffer, "le", 8),
    ],
    programId
  );
  const post = await program.account.blogPost.fetch(postPda);
  console.log(\`Post #\${i}: \${post.title}\`);
}
\`\`\``,
          exercise: {
            question:
              "No blog on-chain, como as seeds da PDA do BlogPost garantem unicidade de cada post?",
            options: [
              "Usando apenas o título do post como seed",
              "Usando o timestamp do bloco como seed",
              "Combinando a pubkey do autor com o post_id sequencial nas seeds",
              "Gerando um UUID aleatório como seed",
            ],
            correctIndex: 2,
          },
          challenge: {
            prompt:
              "Complete o programa Anchor de blog on-chain: defina as structs AuthorProfile e BlogPost, implemente initialize_author e create_post com validações, e configure os erros customizados.",
            starterCode: `use anchor_lang::prelude::*;

declare_id!("B1ogPAFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod blog {
    use super::*;

    pub fn initialize_author(ctx: Context<InitializeAuthor>) -> Result<()> {
        // TODO: Configurar author_profile com:
        // - authority = user pubkey
        // - post_count = 0
        // - bump = ctx.bumps.author_profile

        Ok(())
    }

    pub fn create_post(
        ctx: Context<CreatePost>,
        title: String,
        content: String,
    ) -> Result<()> {
        // TODO: Validar que title.len() <= 50 e content.len() <= 500
        // Use require!(..., BlogError::TituloMuitoLongo)

        // TODO: Configurar blog_post com:
        // - author, post_id, title, content, timestamp, updated=false, bump

        // TODO: Incrementar author_profile.post_count

        Ok(())
    }

    pub fn update_post(
        ctx: Context<UpdatePost>,
        new_title: String,
        new_content: String,
    ) -> Result<()> {
        // TODO: Atualizar title, content e marcar updated = true

        Ok(())
    }
}

// TODO: Definir AuthorProfile com: authority (Pubkey), post_count (u64), bump (u8)
#[account]
#[derive(InitSpace)]
pub struct AuthorProfile {
}

// TODO: Definir BlogPost com: author (Pubkey), post_id (u64), title (String max 50),
// content (String max 500), timestamp (i64), updated (bool), bump (u8)
#[account]
#[derive(InitSpace)]
pub struct BlogPost {
}

#[derive(Accounts)]
pub struct InitializeAuthor<'info> {
    // TODO: account constraints para author_profile (init, payer, space, seeds, bump)

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePost<'info> {
    // TODO: account constraints para blog_post (init, payer, space, seeds com post_count, bump)

    // TODO: account constraints para author_profile (mut, seeds, bump, has_one = authority)

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePost<'info> {
    // TODO: account constraints para blog_post (mut, seeds, bump)

    // TODO: author_profile com has_one para verificar autoridade

    #[account(mut)]
    pub user: Signer<'info>,
}

// TODO: Definir BlogError com variantes: TituloMuitoLongo, ConteudoMuitoLongo, NaoAutorizado
#[error_code]
pub enum BlogError {
}`,
            language: "rust",
            testCases: [
              {
                input: "initialize_author",
                expected:
                  "AuthorProfile created with authority set and post_count = 0",
              },
              {
                input: 'create_post "Meu primeiro post" "Conteúdo do post"',
                expected:
                  "BlogPost PDA created with post_id = 0, author_profile.post_count incremented to 1",
              },
              {
                input: "create_post with title > 50 chars",
                expected: "Err(BlogError::TituloMuitoLongo)",
              },
              {
                input: 'update_post "Título atualizado" "Conteúdo atualizado"',
                expected:
                  "BlogPost updated with new title/content, updated = true",
              },
            ],
          },
        },
      ],
    },
  ],
};
