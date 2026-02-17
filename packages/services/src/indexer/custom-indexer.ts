import type { ServiceResponse } from "../types";

// Indexer Event Types
export enum IndexerEventType {
	PROGRAM_DEPLOY = "program_deploy",
	INSTRUCTION_EXECUTED = "instruction_executed",
	ACCOUNT_CREATED = "account_created",
	ACCOUNT_UPDATED = "account_updated",
	ACCOUNT_CLOSED = "account_closed",
	TRANSACTION_CONFIRMED = "transaction_confirmed",
	BLOCK_PROCESSED = "block_processed",
}

// Indexer Configuration
export interface IndexerConfig {
	rpcUrl: string;
	programId: string;
	startSlot?: number;
	batchSize: number;
	retryAttempts: number;
	retryDelay: number;
	maxConcurrency: number;
	cacheSize: number;
	persistenceEnabled: boolean;
	persistencePath?: string;
}

// Indexed Data Types
export interface IndexedTransaction {
	signature: string;
	slot: number;
	blockTime: number;
	accounts: string[];
	instructions: IndexedInstruction[];
	logs: string[];
	success: boolean;
	fee: number;
	metadata: Record<string, unknown>;
}

export interface IndexedInstruction {
	programId: string;
	accounts: string[];
	data: string;
	decodedData?: unknown;
	innerInstructions?: IndexedInstruction[];
}

export interface IndexedAccount {
	address: string;
	owner: string;
	lamports: number;
	data: string;
	executable: boolean;
	rentEpoch: number;
	lastUpdatedSlot: number;
	metadata: Record<string, unknown>;
}

export interface IndexerMetrics {
	totalTransactions: number;
	totalAccounts: number;
	processedSlots: number;
	currentSlot: number;
	averageProcessingTime: number;
	errorCount: number;
	lastProcessedAt: Date;
	uptime: number;
}

// Indexer Service Interface
export interface IndexerService {
	start(): Promise<ServiceResponse<void>>;
	stop(): Promise<ServiceResponse<void>>;
	getTransaction(signature: string): Promise<ServiceResponse<IndexedTransaction | null>>;
	getAccount(address: string): Promise<ServiceResponse<IndexedAccount | null>>;
	getTransactionsByAccount(
		account: string,
		limit?: number
	): Promise<ServiceResponse<IndexedTransaction[]>>;
	getTransactionsByProgram(
		programId: string,
		limit?: number
	): Promise<ServiceResponse<IndexedTransaction[]>>;
	getTransactionsInSlot(slot: number): Promise<ServiceResponse<IndexedTransaction[]>>;
	getMetrics(): Promise<ServiceResponse<IndexerMetrics>>;
	searchTransactions(
		query: TransactionSearchQuery
	): Promise<ServiceResponse<IndexedTransaction[]>>;
	getAccountHistory(
		address: string,
		fromSlot?: number,
		toSlot?: number
	): Promise<ServiceResponse<IndexedAccount[]>>;
}

// Search Query Interface
export interface TransactionSearchQuery {
	programId?: string;
	account?: string;
	instructionType?: string;
	fromSlot?: number;
	toSlot?: number;
	success?: boolean;
	limit?: number;
	offset?: number;
}

// Indexer Event
export interface IndexerEvent {
	type: IndexerEventType;
	slot: number;
	signature?: string;
	account?: string;
	data: unknown;
	timestamp: Date;
}

// Indexer Event Handler
export type IndexerEventHandler = (event: IndexerEvent) => Promise<void>;

// Raw RPC data interfaces
interface RawInstruction {
	programIdIndex?: number;
	programId?: string;
	accounts?: string[];
	data: string;
}

interface RawTransaction {
	transaction: {
		signatures: string[];
		message: {
			accountKeys: string[];
			instructions: RawInstruction[];
		};
	};
	meta?: {
		logMessages?: string[];
		err: unknown;
		fee?: number;
		computeUnitsConsumed?: number;
		loadedAddresses?: unknown;
		preBalances?: number[];
		postBalances?: number[];
		preAccount?: { owner: string; data?: string[]; executable: boolean; rentEpoch: number } | null;
		postAccount?: { owner: string; data?: string[]; executable: boolean; rentEpoch: number } | null;
	};
}

interface BlockData {
	transactions?: RawTransaction[];
	blockTime?: number;
}

// Custom Indexer Implementation
export class CustomIndexerService implements IndexerService {
	private config: IndexerConfig;
	private isRunning = false;
	private eventHandlers: IndexerEventHandler[] = [];
	private transactionCache: Map<string, IndexedTransaction> = new Map();
	private accountCache: Map<string, IndexedAccount> = new Map();
	private metrics: IndexerMetrics;
	private abortController: AbortController | null = null;

	constructor(config: IndexerConfig) {
		this.config = config;
		this.metrics = {
			totalTransactions: 0,
			totalAccounts: 0,
			processedSlots: 0,
			currentSlot: config.startSlot || 0,
			averageProcessingTime: 0,
			errorCount: 0,
			lastProcessedAt: new Date(),
			uptime: 0,
		};
	}

	async start(): Promise<ServiceResponse<void>> {
		try {
			if (this.isRunning) {
				return { success: false, error: "Indexer is already running" };
			}

			this.isRunning = true;
			this.abortController = new AbortController();
			this.metrics.lastProcessedAt = new Date();

			// Start background processing
			this.startBackgroundProcessing();

			// Emit start event
			await this.emitEvent({
				type: IndexerEventType.PROGRAM_DEPLOY,
				slot: this.metrics.currentSlot,
				data: { message: "Indexer started" },
				timestamp: new Date(),
			});

			return { success: true };
		} catch (error) {
			this.isRunning = false;
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to start indexer: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async stop(): Promise<ServiceResponse<void>> {
		try {
			if (!this.isRunning) {
				return { success: false, error: "Indexer is not running" };
			}

			this.isRunning = false;
			this.abortController?.abort();

			// Persist data if enabled
			if (this.config.persistenceEnabled) {
				await this.persistData();
			}

			return { success: true };
		} catch (error) {
			return {
				success: false,
				error: `Failed to stop indexer: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getTransaction(signature: string): Promise<ServiceResponse<IndexedTransaction | null>> {
		try {
			// Check cache first
			const cached = this.transactionCache.get(signature);
			if (cached) {
				return { success: true, data: cached };
			}

			// Fetch from RPC if not in cache
			const transaction = await this.fetchTransactionFromRPC(signature);
			if (transaction) {
				this.transactionCache.set(signature, transaction);
				// Maintain cache size
				if (this.transactionCache.size > this.config.cacheSize) {
					const firstKey = this.transactionCache.keys().next().value;
					if (firstKey !== undefined) {
						this.transactionCache.delete(firstKey);
					}
				}
			}

			return { success: true, data: transaction };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getAccount(address: string): Promise<ServiceResponse<IndexedAccount | null>> {
		try {
			// Check cache first
			const cached = this.accountCache.get(address);
			if (cached) {
				return { success: true, data: cached };
			}

			// Fetch from RPC if not in cache
			const account = await this.fetchAccountFromRPC(address);
			if (account) {
				this.accountCache.set(address, account);
				// Maintain cache size
				if (this.accountCache.size > this.config.cacheSize) {
					const firstKey = this.accountCache.keys().next().value;
					if (firstKey !== undefined) {
						this.accountCache.delete(firstKey);
					}
				}
			}

			return { success: true, data: account };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get account: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getTransactionsByAccount(
		_account: string,
		_limit = 50
	): Promise<ServiceResponse<IndexedTransaction[]>> {
		try {
			// This would require a more sophisticated indexing strategy
			// For now, return empty array as this requires database indexing
			return { success: true, data: [] };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get transactions by account: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getTransactionsByProgram(
		_programId: string,
		_limit = 50
	): Promise<ServiceResponse<IndexedTransaction[]>> {
		try {
			// This would require a more sophisticated indexing strategy
			// For now, return empty array as this requires database indexing
			return { success: true, data: [] };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get transactions by program: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getTransactionsInSlot(_slot: number): Promise<ServiceResponse<IndexedTransaction[]>> {
		try {
			// This would require storing transactions by slot
			// For now, return empty array as this requires database indexing
			return { success: true, data: [] };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get transactions in slot: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getMetrics(): Promise<ServiceResponse<IndexerMetrics>> {
		try {
			// Update uptime
			this.metrics.uptime = Date.now() - this.metrics.lastProcessedAt.getTime();

			return { success: true, data: { ...this.metrics } };
		} catch (error) {
			return {
				success: false,
				error: `Failed to get metrics: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async searchTransactions(
		_query: TransactionSearchQuery
	): Promise<ServiceResponse<IndexedTransaction[]>> {
		try {
			// This would require a database with proper indexing
			// For now, return empty array
			return { success: true, data: [] };
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to search transactions: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	async getAccountHistory(
		address: string,
		_fromSlot?: number,
		_toSlot?: number
	): Promise<ServiceResponse<IndexedAccount[]>> {
		try {
			// This would require storing account history
			// For now, return current account state
			const currentAccount = await this.getAccount(address);
			return {
				success: true,
				data: currentAccount.data ? [currentAccount.data] : [],
			};
		} catch (error) {
			this.metrics.errorCount++;
			return {
				success: false,
				error: `Failed to get account history: ${error instanceof Error ? error.message : "Unknown error"}`,
			};
		}
	}

	// Add event handler
	addEventHandler(handler: IndexerEventHandler): void {
		this.eventHandlers.push(handler);
	}

	// Remove event handler
	removeEventHandler(handler: IndexerEventHandler): void {
		const index = this.eventHandlers.indexOf(handler);
		if (index > -1) {
			this.eventHandlers.splice(index, 1);
		}
	}

	// Private methods
	private async startBackgroundProcessing(): Promise<void> {
		const processLoop = async () => {
			while (this.isRunning && !this.abortController?.signal.aborted) {
				try {
					await this.processNextBatch();
					await this.delay(1000); // Process every second
				} catch (error) {
					console.error("Error in processing loop:", error);
					this.metrics.errorCount++;
					await this.delay(this.config.retryDelay);
				}
			}
		};

		// Start processing loop
		processLoop().catch((error) => {
			console.error("Background processing failed:", error);
		});
	}

	private async processNextBatch(): Promise<void> {
		const startTime = Date.now();

		try {
			// Get current slot
			const currentSlot = await this.getCurrentSlot();

			if (currentSlot > this.metrics.currentSlot) {
				// Process slots in batches
				const slotsToProcess = Math.min(
					this.config.batchSize,
					currentSlot - this.metrics.currentSlot
				);

				for (let i = 0; i < slotsToProcess; i++) {
					const slot = this.metrics.currentSlot + i + 1;
					await this.processSlot(slot);
				}

				this.metrics.currentSlot += slotsToProcess;
				this.metrics.processedSlots += slotsToProcess;
			}

			// Update metrics
			const processingTime = Date.now() - startTime;
			this.metrics.averageProcessingTime =
				(this.metrics.averageProcessingTime + processingTime) / 2;
			this.metrics.lastProcessedAt = new Date();
		} catch (error) {
			console.error("Error processing batch:", error);
			throw error;
		}
	}

	private async processSlot(slot: number): Promise<void> {
		try {
			// Get confirmed block
			const block = await this.fetchBlock(slot);
			if (!block) return;

			// Process transactions
			for (const tx of block.transactions || []) {
				await this.processTransaction(tx, slot, block.blockTime ?? 0);
			}

			// Emit block processed event
			await this.emitEvent({
				type: IndexerEventType.BLOCK_PROCESSED,
				slot,
				data: {
					transactionCount: block.transactions?.length || 0,
					blockTime: block.blockTime,
				},
				timestamp: new Date(),
			});
		} catch (error) {
			console.error(`Error processing slot ${slot}:`, error);
			this.metrics.errorCount++;
		}
	}

	private async processTransaction(tx: RawTransaction, slot: number, blockTime: number): Promise<void> {
		try {
			const signature = tx.transaction.signatures[0];
			const indexedTx: IndexedTransaction = {
				signature,
				slot,
				blockTime,
				accounts: tx.transaction.message.accountKeys,
				instructions: this.parseInstructions(tx.transaction.message.instructions),
				logs: tx.meta?.logMessages || [],
				success: tx.meta?.err === null,
				fee: tx.meta?.fee || 0,
				metadata: {
					computeUnits: tx.meta?.computeUnitsConsumed,
					loadedAddresses: tx.meta?.loadedAddresses,
				},
			};

			// Cache transaction
			this.transactionCache.set(signature, indexedTx);
			this.metrics.totalTransactions++;

			// Process account changes
			if (tx.meta?.preBalances && tx.meta?.postBalances) {
				await this.processAccountChanges(tx, slot);
			}

			// Emit transaction event
			await this.emitEvent({
				type: IndexerEventType.TRANSACTION_CONFIRMED,
				slot,
				signature,
				data: indexedTx,
				timestamp: new Date(),
			});
		} catch (error) {
			console.error(`Error processing transaction ${tx.transaction.signatures[0]}:`, error);
		}
	}

	private async processAccountChanges(tx: RawTransaction, slot: number): Promise<void> {
		if (!tx.meta) return;
		const accountKeys = tx.transaction.message.accountKeys;

		for (let i = 0; i < accountKeys.length; i++) {
			const address = accountKeys[i];
			const preBalance = tx.meta.preBalances?.[i] ?? 0;
			const postBalance = tx.meta.postBalances?.[i] ?? 0;

			// Check if account was created or closed
			const preAccount = tx.meta.preAccount;
			const postAccount = tx.meta.postAccount;

			if (!preAccount && postAccount) {
				// Account created
				await this.emitEvent({
					type: IndexerEventType.ACCOUNT_CREATED,
					slot,
					account: address,
					data: { balance: postBalance },
					timestamp: new Date(),
				});
			} else if (preAccount && !postAccount) {
				// Account closed
				await this.emitEvent({
					type: IndexerEventType.ACCOUNT_CLOSED,
					slot,
					account: address,
					data: { finalBalance: preBalance },
					timestamp: new Date(),
				});
			} else if (preAccount && postAccount) {
				// Account updated
				await this.emitEvent({
					type: IndexerEventType.ACCOUNT_UPDATED,
					slot,
					account: address,
					data: {
						balanceChange: postBalance - preBalance,
						preBalance,
						postBalance,
					},
					timestamp: new Date(),
				});
			}

			// Update account cache
			if (postAccount) {
				const indexedAccount: IndexedAccount = {
					address,
					owner: postAccount.owner,
					lamports: postBalance,
					data: postAccount.data?.[0] || "",
					executable: postAccount.executable,
					rentEpoch: postAccount.rentEpoch,
					lastUpdatedSlot: slot,
					metadata: {},
				};

				this.accountCache.set(address, indexedAccount);
				this.metrics.totalAccounts++;
			}
		}
	}

	private parseInstructions(instructions: RawInstruction[]): IndexedInstruction[] {
		return instructions.map((instruction) => ({
			programId:
				instruction.programIdIndex !== undefined
					? "resolved_program_id" // Would need account resolution
					: instruction.programId || "",
			accounts: instruction.accounts || [],
			data: instruction.data,
			decodedData: this.decodeInstructionData(instruction.data),
		}));
	}

	private decodeInstructionData(data: string): unknown {
		// This would implement instruction decoding for the Academy program
		// For now, return raw data
		return { raw: data };
	}

	private async fetchTransactionFromRPC(_signature: string): Promise<IndexedTransaction | null> {
		// Implement RPC call to get transaction
		// This is a placeholder
		return null;
	}

	private async fetchAccountFromRPC(_address: string): Promise<IndexedAccount | null> {
		// Implement RPC call to get account info
		// This is a placeholder
		return null;
	}

	private async getCurrentSlot(): Promise<number> {
		// Implement RPC call to get current slot
		// This is a placeholder
		return this.metrics.currentSlot + 1;
	}

	private async fetchBlock(_slot: number): Promise<BlockData | null> {
		// Implement RPC call to get confirmed block
		// This is a placeholder
		return null;
	}

	private async emitEvent(event: IndexerEvent): Promise<void> {
		await Promise.all(this.eventHandlers.map((handler) => handler(event)));
	}

	private async persistData(): Promise<void> {
		if (!this.config.persistencePath) return;

		// Implement data persistence
		// This would save cached data to disk
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}

// Indexer Factory
export const IndexerFactory = {
	createCustomIndexer(config: IndexerConfig): CustomIndexerService {
		return new CustomIndexerService(config);
	},

	createHeliusEnhancedIndexer(
		heliusApiKey: string,
		config: Partial<IndexerConfig>
	): CustomIndexerService {
		// Enhanced indexer with Helius optimizations
		const fullConfig: IndexerConfig = {
			rpcUrl: `https://mainnet.helius-rpc.com/?api-key=${heliusApiKey}`,
			programId: config.programId || "",
			batchSize: config.batchSize || 10,
			retryAttempts: config.retryAttempts || 3,
			retryDelay: config.retryDelay || 1000,
			maxConcurrency: config.maxConcurrency || 5,
			cacheSize: config.cacheSize || 10_000,
			persistenceEnabled: config.persistenceEnabled || false,
			...(config.persistencePath !== undefined && { persistencePath: config.persistencePath }),
		};

		return new CustomIndexerService(fullConfig);
	},
};
