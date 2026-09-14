import { createApp } from 'vue';
import App from './App.vue';
import createUnoStyle from 'unocss-inline/style';

const container = document.body.appendChild(document.createElement('div'));
container.dataset.name = 'vue-shadow-dom';
const shadowRoot = container.attachShadow({ mode: 'open' });
createApp(App).mount(shadowRoot.appendChild(document.createElement('div')));
shadowRoot.appendChild(createUnoStyle());
