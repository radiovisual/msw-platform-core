export type ContractStatus = 'active' | 'inactive' | 'incomplete' | 'terminated' | 'blocked';

export type ContractSet = 'new' | 'partially' | 'done';

export interface Contract {
	contractId: number;
	datauserName: string;
	datauserBR: string;
	bic: string;
	aiContractId: number;
	openingDate: string;
	clientAdvisor: string;
	contractStatus: ContractStatus;
	contractSet: ContractSet;
	contractSettime: string;
}

export type SyncStatus = 'success' | 'failure' | 'in_progress';

export interface SyncStatusResponse {
	lastSuccessfulSync: string;
	lastAttemptedSync: string;
	status: SyncStatus;
	statusMessage: string;
}
