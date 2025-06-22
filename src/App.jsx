import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import Main from './Main';

export default function App() {
  return (
    <Routes>
      <Route path="/"     element={<Home />} />
      <Route path="/main" element={<Main />} />
    </Routes>
  );
}