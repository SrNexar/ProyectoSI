import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard_New.tsx'
import Products from './pages/Products.tsx'
import EOQ from './pages/EOQ.tsx'
import Alerts from './pages/Alerts.tsx'
import Reports from './pages/Reports.tsx'
import Settings from './pages/Settings.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import './styles.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/eoq" element={<EOQ />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  )
}

export default App
