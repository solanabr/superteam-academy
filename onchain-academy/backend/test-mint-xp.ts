// backend/test-mint-xp.ts
import { xpMinter } from './src/services/onchain/xp-minter.service';

async function test() {
  // Health check
  const healthy = await xpMinter.healthCheck();
  if (!healthy) {
    console.error('Minter not healthy!');
    process.exit(1);
  }
  
  // Test mint (use your own wallet or generate a test one)
  const testWallet = '6iGGUKGC6Lz3tYasYhV8BnLhK3vpYJ3ypjb2KGHnGVdo';
  
  // Mint 50 XP
  const result = await xpMinter.mintXP(testWallet, 50);
  console.log('Mint result:', result);
  
  // Check balance
  const balance = await xpMinter.getXPBalance(testWallet);
  console.log('Balance:', balance, 'XP');
}

test();