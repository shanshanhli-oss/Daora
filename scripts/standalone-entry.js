import css from '../src/styles.css';
const style=document.createElement('style');
style.textContent=css;
document.head.appendChild(style);
import('../src/main.js');
