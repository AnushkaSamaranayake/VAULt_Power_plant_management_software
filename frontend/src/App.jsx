import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Transformers from './pages/Transformers'
import InspectionDetails from './pages/InspectionDetails'
import TransformerDetails from './pages/TransformerDetails'
import ThermalInspectionForm from './pages/ThermalInspectionForm'
import Settings from './pages/Settings'

const App = () => {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transformers" element={<Transformers />} />
          <Route path="/transformers/:transformerNo" element={<TransformerDetails />} />
          <Route path="/inspections/:inspectionNo" element={<InspectionDetails />} />
          <Route path="/inspection/:inspectionNo/form" element={<ThermalInspectionForm />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
