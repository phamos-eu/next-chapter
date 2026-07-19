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
	FrappeUIProvider,
	Select,
	TextInput,
	Textarea,
	Toast,
	frappeRequest,
	resourcesPlugin,
	setConfig,
} from 'frappe-ui'

import App from './App.vue'
import router from './router'

setConfig('resourceFetcher', frappeRequest)

const app = createApp(App)
app.use(router)
app.use(resourcesPlugin)

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
