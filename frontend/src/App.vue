<template>
  <FrappeUIProvider>
    <router-view />
    <Dialogs />
  </FrappeUIProvider>
</template>

<script setup>
import { Dialogs, FrappeUIProvider } from 'frappe-ui'
</script>
