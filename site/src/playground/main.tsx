/** Entry for the Home page bundle: takes over #playground, keeping the page's static tree as the fallback. */
import { createRoot } from 'react-dom/client';
import Playground from './Playground';
import './controls.css';

const root = document.getElementById('playground');
if (root) {
  const staticHtml = root.querySelector('.home-tree')?.innerHTML ?? '';
  createRoot(root).render(<Playground staticHtml={staticHtml} />);
}
