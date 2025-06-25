import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Main from './Main';
import Modules from './Modules';

export default function App() {
  return (
    <Routes>
      <Route path="/"     element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/main" element={<Main />} />

    </Routes>
  );
}