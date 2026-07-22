/** Shared mock config for idea-growth funnel (placeholders). */

export const FUNNEL_STAGES = [
	{
		id: 'infinity',
		label: '∞',
		metaphor: 'Seed',
		job: 'Capture anything; no commitment',
		wip: null,
	},
	{
		id: '9',
		label: '9',
		metaphor: 'Sprout',
		job: 'First filter — keep what still interests you',
		wip: 9,
	},
	{
		id: '7',
		label: '7',
		metaphor: 'Seedling',
		job: 'Clarify the point in a few sentences',
		wip: 7,
	},
	{
		id: '5',
		label: '5',
		metaphor: 'Young plant',
		job: 'Structure emerging',
		wip: 5,
	},
	{
		id: '3',
		label: '3',
		metaphor: 'Growing',
		job: 'Serious candidates',
		wip: 3,
	},
	{
		id: '1',
		label: '1',
		metaphor: 'Mature focus',
		job: 'The one you write deeply',
		wip: 1,
	},
	{
		id: 'done',
		label: 'Done',
		metaphor: 'Harvest',
		job: 'Finished chapter',
		wip: null,
	},
]

export const WRITE_STAGES = FUNNEL_STAGES.filter((s) => s.id !== 'done')

/** Progressive editor capabilities by stage id */
export function capabilitiesFor(stageId) {
	const order = ['infinity', '9', '7', '5', '3', '1']
	const idx = order.indexOf(stageId)
	const atLeast = (minId) => idx >= order.indexOf(minId)

	return {
		title: true,
		plainTextOnly: idx <= order.indexOf('9'),
		wordHint: atLeast('9'),
		boldItalic: atLeast('7'),
		headingsLists: atLeast('5'),
		tablesLinks: atLeast('3'),
		startSession: atLeast('5'),
		complexityTools: atLeast('1'),
		richEditor: atLeast('7'),
	}
}

export function stageById(id) {
	return FUNNEL_STAGES.find((s) => s.id === id) || FUNNEL_STAGES[0]
}

export function stageByParam(param) {
	if (!param) return WRITE_STAGES[0]
	const decoded = decodeURIComponent(String(param))
	if (decoded === '∞' || decoded === 'infinity') return stageById('infinity')
	return stageById(decoded) || WRITE_STAGES[0]
}

/** Seed mock chapters for the growth board */
export const MOCK_CHAPTERS = [
	{
		name: 'MOCK-001',
		title: 'Customer ticket inbox',
		stage: 'infinity',
		snippet: 'Need a simple place to catch support emails…',
	},
	{
		name: 'MOCK-002',
		title: 'Onboarding checklist',
		stage: 'infinity',
		snippet: 'New hires lose a week figuring out tools.',
	},
	{
		name: 'MOCK-003',
		title: 'Inventory sync',
		stage: 'infinity',
		snippet: 'Warehouse counts drift from the shop floor.',
	},
	{
		name: 'MOCK-004',
		title: 'Quote follow-ups',
		stage: 'infinity',
		snippet: 'Sales forgets to nudge open quotes.',
	},
	{
		name: 'MOCK-005',
		title: 'Expense receipts',
		stage: '9',
		snippet: 'Photos of receipts that never land in finance.',
	},
	{
		name: 'MOCK-006',
		title: 'Project status pulse',
		stage: '9',
		snippet: 'Friday update that writes itself from tasks.',
	},
	{
		name: 'MOCK-007',
		title: 'Supplier scorecards',
		stage: '7',
		snippet: 'Rate delivery and quality in one view.',
	},
	{
		name: 'MOCK-008',
		title: 'Leave approval flow',
		stage: '7',
		snippet: 'Manager sees coverage before approving.',
	},
	{
		name: 'MOCK-009',
		title: 'CRM pipeline hygiene',
		stage: '5',
		snippet: 'Stale deals surface automatically each Monday.',
	},
	{
		name: 'MOCK-010',
		title: 'Manufacturing handoff',
		stage: '5',
		snippet: 'Engineering signs off before production starts.',
	},
	{
		name: 'MOCK-011',
		title: 'Customer health score',
		stage: '3',
		snippet: 'Combine tickets, usage, and invoices into one signal.',
	},
	{
		name: 'MOCK-012',
		title: 'Implementation playbook',
		stage: '1',
		snippet: 'The chapter we write deeply this quarter.',
		content:
			'<p>A clear playbook for how we take a customer from signed contract to first successful week in production.</p><p>Start with discovery notes, then milestones, then the handoff checklist.</p>',
	},
	{
		name: 'MOCK-013',
		title: 'Legacy import notes',
		stage: 'done',
		snippet: 'Shipped — CSV import for old order history.',
	},
]

export const MOCK_LAST_SESSION_WORDS = 420
export const MOCK_SESSION_DURATION_MINS = 60
