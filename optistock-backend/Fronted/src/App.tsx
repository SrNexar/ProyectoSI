import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.tsx'
import Dashboard from './pages/Dashboard_New.tsx'
import Products from './pages/Products.tsx'
import EOQ from './pages/EOQ.tsx'
import Alerts from './pages/Alerts.tsx'
import AlertasAvanzadas from './pages/AlertasAvanzadas.tsx'
import Reports from './pages/Reports.tsx'
import ChatbotPage from './pages/ChatbotPage.tsx'
import './styles.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/eoq" element={<EOQ />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/alertas-avanzadas" element={<AlertasAvanzadas />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/chatbot" element={<ChatbotPage />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
