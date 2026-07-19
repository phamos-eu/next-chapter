import './index.css'

import { createApp } from 'vue'
import {
	Alert,
	Badge,
	Button,
	Dialog,
	Dialogs,
	ErrorMessage,
	FeatherIcon,
	FormControl,
	FrappeUI,
	FrappeUIProvider,
	Select,
	TextInput,
	Textarea,
	Toast,
	frappeRequest,
	setConfig,
} from 'frappe-ui'

import App from './App.vue'
import router from './router'

function ensureCsrf() {
	const bootToken =
		window.csrf_token && window.csrf_token !== '{{ csrf_token }}'
			? window.csrf_token
			: window.frappe?.boot?.csrf_token
	if (bootToken && bootToken !== '{{ csrf_token }}') {
		window.csrf_token = bootToken
	}
}

ensureCsrf()
setConfig('resourceFetcher', frappeRequest)

const app = createApp(App)
app.use(router)
app.use(FrappeUI)

const globals = {
	Button,
	Badge,
	Dialog,
	Dialogs,
	Alert,
	ErrorMessage,
	FeatherIcon,
	FormControl,
	Select,
	TextInput,
	Textarea,
	Toast,
	FrappeUIProvider,
}
for (const [name, component] of Object.entries(globals)) {
	app.component(name, component)
}

app.mount('#app')
