/**
 * Rust & Anchor Code Execution Service
 * Executes Rust/Anchor code via backend with proper error handling
 */

export interface RustExecutionOutput {
  stdout: string
  stderr: string
  executionTime: number
  success: boolean
  compileTime?: number
  warnings?: string[]
}

export interface RustExecutionRequest {
  code: string
  language: 'rust' | 'anchor'
  timeout?: number
  features?: string[]
}

export class RustExecutionService {
  private static readonly API_BASE = '/api/code-execution'
  private static readonly DEFAULT_TIMEOUT = 30000

  /**
   * Execute Rust code with compilation and runtime
   */
  static async executeRust(
    code: string,
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<RustExecutionOutput> {
    return this.execute({
      code,
      language: 'rust',
      timeout,
    })
  }

  /**
   * Execute Anchor program code
   */
  static async executeAnchor(
    code: string,
    features: string[] = [],
    timeout: number = this.DEFAULT_TIMEOUT
  ): Promise<RustExecutionOutput> {
    return this.execute({
      code,
      language: 'anchor',
      timeout,
      features,
    })
  }

  /**
   * Execute code via backend API
   */
  private static async execute(
    request: RustExecutionRequest
  ): Promise<RustExecutionOutput> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.API_BASE}/rust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        return {
          stdout: '',
          stderr: error.message || `HTTP ${response.status}`,
          executionTime: Date.now() - startTime,
          success: false,
        }
      }

      const result = await response.json()
      return {
        ...result,
        executionTime: Date.now() - startTime,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return {
        stdout: '',
        stderr: `Execution error: ${errorMessage}`,
        executionTime: Date.now() - startTime,
        success: false,
      }
    }
  }

  /**
   * Validate Rust syntax without execution
   */
  static async validateRust(code: string): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const response = await fetch(`${this.API_BASE}/rust/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })

      if (!response.ok) {
        return {
          valid: false,
          errors: ['Validation request failed'],
        }
      }

      return response.json()
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation error'],
      }
    }
  }

  /**
   * Get Rust/Anchor code templates
   */
  static getTemplate(type: 'rust' | 'anchor' | 'anchor-instruction'): string {
    const templates: Record<string, string> = {
      rust: `fn main() {
    println!("Hello, Solana!");
    
    // Your Rust code here
    let x = 42;
    println!("The answer is: {}", x);
}`,

      anchor: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod academy {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing...");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}`,

      'anchor-instruction': `use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct MyInstruction {
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MyInstruction>) -> Result<()> {
    msg!("Instruction executed!");
    Ok(())
}`,
    }

    return templates[type] || templates.rust
  }
}
