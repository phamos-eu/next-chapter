<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
    <div class="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
      <div
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-gray-900 text-xs font-semibold text-white dark:bg-white dark:text-gray-900"
      >
        NC
      </div>
      <div class="min-w-0">
        <div class="truncate text-base font-semibold text-gray-900 dark:text-white">NextChapter</div>
        <div class="truncate text-xs text-gray-500 dark:text-gray-400">
          Implementation Planning
        </div>
      </div>
    </div>

    <main class="flex min-w-0 flex-1 flex-col items-center justify-center p-6">
      <div class="w-full max-w-md">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to NextChapter
          </h1>
          <p class="mt-2 text-gray-500 dark:text-gray-400">
            Let's set up your implementation story and create your first ideas.
          </p>
        </div>

        <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
          <!-- Company Context -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Company Context
            </h2>
            <div class="space-y-4">
              <FormControl
                v-model="form.companyName"
                type="text"
                label="Company Name"
                placeholder="Your company name"
                required
              />
              <FormControl
                v-model="form.companyPurpose"
                type="textarea"
                label="Company Purpose"
                placeholder="What does your company do?"
                rows="3"
              />
              <div class="grid grid-cols-2 gap-4">
                <FormControl
                  v-model="form.employeesNow"
                  type="number"
                  label="Current Employees"
                  placeholder="0"
                />
                <FormControl
                  v-model="form.employees1y"
                  type="number"
                  label="Employees in 1 Year"
                  placeholder="0"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <FormControl
                  v-model="form.employees3y"
                  type="number"
                  label="Employees in 3 Years"
                  placeholder="0"
                />
                <FormControl
                  v-model="form.employees7y"
                  type="number"
                  label="Employees in 7 Years"
                  placeholder="0"
                />
              </div>
              <FormControl
                v-model="form.companyStage"
                type="select"
                label="Company Stage"
                :options="stageOptions"
              />
              <FormControl
                v-model="form.erpMotivation"
                type="textarea"
                label="ERP Motivation"
                placeholder="Why are you implementing an ERP system?"
                rows="3"
              />
            </div>
          </div>

          <!-- First Ideas -->
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Your First Three Ideas
            </h2>
            <p class="mb-4 text-sm text-gray-500 dark:text-gray-400">
              What are the top three priorities for your implementation? These will become your first ideas.
            </p>
            <div class="space-y-4">
              <FormControl
                v-model="form.priority1"
                type="text"
                label="Priority 1"
                placeholder="First priority"
                required
              />
              <FormControl
                v-model="form.priority2"
                type="text"
                label="Priority 2"
                placeholder="Second priority"
              />
              <FormControl
                v-model="form.priority3"
                type="text"
                label="Priority 3"
                placeholder="Third priority"
              />
            </div>
          </div>

          <div class="flex justify-end gap-3">
            <Button
              variant="subtle"
              label="Skip for now"
              @click="skipSetup"
            />
            <Button
              type="submit"
              variant="solid"
              label="Complete Setup"
              :disabled="!form.companyName || !form.priority1"
            />
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button, FormControl, toast } from 'frappe-ui'
import { useWorkspace } from '@/composables/useWorkspace'

const router = useRouter()
const { completeSetup } = useWorkspace()

const form = ref({
  companyName: '',
  companyPurpose: '',
  employeesNow: '',
  employees1y: '',
  employees3y: '',
  employees7y: '',
  companyStage: '',
  erpMotivation: '',
  priority1: '',
  priority2: '',
  priority3: '',
})

const stageOptions = [
  { label: 'Startup', value: 'Startup' },
  { label: 'Growth', value: 'Growth' },
  { label: 'Established', value: 'Established' },
  { label: 'Enterprise', value: 'Enterprise' },
]

async function handleSubmit() {
  try {
    await completeSetup(
      form.value.companyName,
      form.value.companyPurpose,
      form.value.employeesNow ? Number(form.value.employeesNow) : null,
      form.value.employees1y ? Number(form.value.employees1y) : null,
      form.value.employees3y ? Number(form.value.employees3y) : null,
      form.value.employees7y ? Number(form.value.employees7y) : null,
      form.value.companyStage,
      form.value.erpMotivation,
      form.value.priority1,
      form.value.priority2,
      form.value.priority3,
    )
    toast.success('Setup complete!')
    router.push('/ideas')
  } catch (e) {
    toast.error(e.messages?.[0] || e.message || 'Failed to complete setup')
  }
}

function skipSetup() {
  router.push('/ideas')
}
</script>
