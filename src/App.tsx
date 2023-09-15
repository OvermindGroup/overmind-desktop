import './App.css';
import { initDb } from './dataHelpers';
import Dashboard from './dashboard/Dashboard'

function App() {
  initDb()

  return (
    <Dashboard>
    </Dashboard>
  );
}

export default App;
