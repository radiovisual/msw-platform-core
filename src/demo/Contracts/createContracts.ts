import { Contract, ContractStatus, ContractSet } from './Contract.types';

export function createContracts(count: number = 50): Contract[] {
	const statuses: ContractStatus[] = ['active', 'inactive', 'incomplete', 'terminated', 'blocked'];
	const sets: ContractSet[] = ['new', 'partially', 'done'];

	const companies = [
		'Tech Solutions Inc',
		'Global Industries',
		'Innovation Corp',
		'Digital Dynamics',
		'Future Systems',
		'Advanced Analytics',
		'Smart Solutions',
		'NextGen Technologies',
		'Data Insights Ltd',
		'Cloud Computing Co',
		'AI Technologies',
		'Quantum Systems',
		'Cyber Security Inc',
		'Network Solutions',
		'Software Dynamics',
		'Mobile Apps Ltd',
		'Web Services Co',
		'Database Systems',
		'Enterprise Solutions',
		'Business Intelligence',
		'Machine Learning Inc',
		'Blockchain Technologies',
		'IoT Solutions',
		'DevOps Systems',
		'API Services Ltd',
		'Microservices Co',
		'Container Solutions',
		'Serverless Inc',
	];

	const branchCodes = [
		'BR001',
		'BR002',
		'BR003',
		'BR004',
		'BR005',
		'BR006',
		'BR007',
		'BR008',
		'BR009',
		'BR010',
		'BR011',
		'BR012',
		'BR013',
		'BR014',
		'BR015',
		'BR016',
		'BR017',
		'BR018',
		'BR019',
		'BR020',
		'BR021',
		'BR022',
		'BR023',
		'BR024',
		'BR025',
		'BR026',
		'BR027',
		'BR028',
		'BR029',
		'BR030',
		'BR031',
		'BR032',
	];

	const advisors = [
		'John Smith',
		'Sarah Johnson',
		'Michael Brown',
		'Emily Davis',
		'David Wilson',
		'Jessica Miller',
		'Christopher Garcia',
		'Amanda Rodriguez',
		'Matthew Martinez',
		'Ashley Anderson',
		'Daniel Taylor',
		'Stephanie Thomas',
		'Kevin Jackson',
		'Rachel White',
	];

	const contracts: Contract[] = [];

	for (let i = 1; i <= count; i++) {
		const openingDate = new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
		const contractSetDate = new Date(openingDate.getTime() + Math.random() * 90 * 24 * 60 * 60 * 1000);

		contracts.push({
			contractId: i,
			datauserName: companies[Math.floor(Math.random() * companies.length)],
			datauserBR: branchCodes[Math.floor(Math.random() * branchCodes.length)],
			bic: `BIC${String(i).padStart(6, '0')}`,
			aiContractId: 1000 + i,
			openingDate: openingDate.toISOString().split('T')[0],
			clientAdvisor: advisors[Math.floor(Math.random() * advisors.length)],
			contractStatus: statuses[Math.floor(Math.random() * statuses.length)],
			contractSet: sets[Math.floor(Math.random() * sets.length)],
			contractSettime: contractSetDate.toISOString().split('T')[0],
		});
	}

	return contracts;
}
