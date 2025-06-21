import './index.css';
import { LexicalEditor } from './components/LexicalEditor';

function App() {

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">

        <main>
          <LexicalEditor />
        </main>
      </div>
    </div>
  );
}

export default App; 