import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

console.log('main.tsx loading...');

const rootElement = document.getElementById('root')!;
createRoot(rootElement).render(<App />);
console.log('main.tsx rendered!');


