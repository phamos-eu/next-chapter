<template>
  <div class="flex min-h-screen items-center justify-center bg-surface-gray-1 p-6">
    <div class="w-full max-w-lg rounded-xl border border-outline-gray-1 bg-surface-white p-6 shadow-sm">
      <div class="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-gray-5">
        Get started
      </div>
      <h1 class="mb-1 text-xl font-semibold text-ink-gray-9">{{ current.title }}</h1>
      <p class="mb-4 text-sm text-ink-gray-5">{{ current.help }}</p>
      <p class="mb-4 text-xs text-ink-gray-4">Step {{ step + 1 }} of {{ steps.length }}</p>

      <div class="space-y-3">
        <template v-if="step === 2">
          <div class="grid grid-cols-2 gap-3">
            <FormControl v-model="form.employees_now" type="number" label="Today" />
            <FormControl v-model="form.employees_1y" type="number" label="In 1 year" />
            <FormControl v-model="form.employees_3y" type="number" label="In 3 years" />
            <FormControl v-model="form.employees_7y" type="number" label="In 7 years" />
          </div>
        </template>
        <template v-else-if="step === 5">
          <FormControl v-model="form.priority_1" type="text" label="First idea" placeholder="e.g. Ticketing" />
          <FormControl v-model="form.priority_2" type="text" label="Second idea" placeholder="Optional" />
          <FormControl v-model="form.priority_3" type="text" label="Third idea" placeholder="Optional" />
        </template>
        <template v-else>
          <FormControl
            v-model="form[current.field]"
            :type="current.type"
            :label="current.label"
            :placeholder="current.placeholder"
          />
        </template>
      </div>

      <Alert v-if="error" class="mt-4" theme="red" :title="error" />

      <div class="mt-6 flex items-center justify-between">
        <Button v-if="step > 0" variant="subtle" @click="step -= 1">Back</Button>
        <span v-else />
        <Button variant="solid" :loading="saving" @click="next">
          {{ step === steps.length - 1 ? 'Start writing' : 'Continue' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Alert, Button, FormControl, call, toast } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const { bootstrap } = useWorkspace()
const step = ref(0)
const saving = ref(false)
const error = ref('')

const form = reactive({
	company_name: '',
	company_purpose: '',
	employees_now: '',
	employees_1y: '',
	employees_3y: '',
	employees_7y: '',
	company_stage: '',
	erp_motivation: '',
	priority_1: '',
	priority_2: '',
	priority_3: '',
})

const steps = [
	{
		title: 'What is your company called?',
		help: "We'll use this as the name of your implementation story.",
		field: 'company_name',
		type: 'text',
		label: 'Company name',
		placeholder: 'e.g. Acme GmbH',
	},
	{
		title: 'What does the company do?',
		help: 'A short purpose statement is enough.',
		field: 'company_purpose',
		type: 'textarea',
		label: 'Purpose',
		placeholder: 'Why does the company exist?',
	},
	{
		title: 'How many people — now and ahead?',
		help: 'Rough numbers are fine.',
	},
	{
		title: 'Where is the company today?',
		help: 'A few sentences about the current stage.',
		field: 'company_stage',
		type: 'textarea',
		label: 'Current stage',
		placeholder: 'e.g. growing fast…',
	},
	{
		title: 'Why change systems?',
		help: 'What is pushing you toward a new ERP?',
		field: 'erp_motivation',
		type: 'textarea',
		label: 'Motivation',
		placeholder: 'What should get better?',
	},
	{
		title: 'What would you like to tackle first?',
		help: 'Name up to three starting ideas. You can add more later.',
	},
]

const current = computed(() => steps[step.value])

function validate() {
	error.value = ''
	if (step.value === 0 && !String(form.company_name || '').trim()) {
		error.value = 'Please enter a company name.'
		return false
	}
	if (step.value === 5) {
		const titles = [form.priority_1, form.priority_2, form.priority_3].filter((t) =>
			String(t || '').trim(),
		)
		if (!titles.length) {
			error.value = 'Add at least one idea to begin.'
			return false
		}
	}
	return true
}

async function next() {
	if (!validate()) return
	if (step.value < steps.length - 1) {
		step.value += 1
		return
	}
	saving.value = true
	try {
		await call('next_chapter.api.setup.complete_setup', { ...form })
		await bootstrap(true)
		toast.success('Your story is ready')
		router.replace('/ideas')
	} catch (e) {
		error.value = e.messages?.[0] || e.message || 'Could not create your story'
	} finally {
		saving.value = false
	}
}
</script>
