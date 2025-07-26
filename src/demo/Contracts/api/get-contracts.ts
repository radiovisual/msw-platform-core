import { Contract } from '../Contract.types';

export class ContractsAPIError extends Error {
	constructor(message: string, public status?: number) {
		super(message);
		this.name = 'ContractsAPIError';
	}
}

export async function fetchContracts(): Promise<Contract[]> {
	try {
		const response = await fetch('/contracts/all');

		if (!response.ok) {
			const message = `Failed to fetch contracts. Status: ${response.status}`;
			throw new ContractsAPIError(message, response.status);
		}

		const data: Contract[] = await response.json();

		// Optional: validate structure if needed
		if (!Array.isArray(data)) {
			throw new ContractsAPIError('Malformed contracts response');
		}

		return data;
	} catch (err: any) {
		if (err instanceof ContractsAPIError) {
			throw err;
		}
		throw new ContractsAPIError('Network error while fetching contracts');
	}
}
